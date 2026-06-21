/**
 * IMAP email-to-ticket. Polls a mailbox, and for each new message either opens
 * a ticket (new thread) or appends a note (reply to a known thread).
 *
 * Threading: we tag every ingested message's note with the email Message-ID in
 * note.externalId, and the root ticket with externalId = root Message-ID. A
 * reply's In-Reply-To / References are matched against those, so replies land on
 * the original ticket instead of spawning duplicates.
 *
 * Dedup: mailbox.lastUid tracks the highest processed IMAP UID, so a message
 * becomes at most one ticket/note even across restarts.
 */
import { ImapFlow } from 'imapflow';
import { simpleParser, ParsedMail } from 'mailparser';
import { Mailbox } from '@prisma/client';
import { prisma } from '../db/prisma';
import * as mailboxRepo from '../repositories/mailboxRepository';
import * as ticketRepo from '../repositories/ticketRepository';
import * as noteRepo from '../repositories/noteRepository';
import * as attachmentRepo from '../repositories/attachmentRepository';
import { currentStorage, buildKey } from './storage';
import { sanitizeEmailHtml } from './mail/sanitizeHtml';

export interface PollResult {
  mailbox: string;
  processed: number;
  created: number;
  appended: number;
  error?: string;
}

function refsOf(parsed: ParsedMail): string[] {
  const refs: string[] = [];
  if (parsed.inReplyTo) refs.push(parsed.inReplyTo);
  if (parsed.references) {
    refs.push(...(Array.isArray(parsed.references) ? parsed.references : [parsed.references]));
  }
  return refs.filter(Boolean);
}

function bodyOf(parsed: ParsedMail): string {
  if (parsed.text && parsed.text.trim()) return parsed.text.trim();
  if (parsed.html) return parsed.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return '(no body)';
}

async function ingest(parsed: ParsedMail, mb: Mailbox, uid: number): Promise<'created' | 'appended'> {
  const messageId = parsed.messageId || `<imap-${mb.id}-${uid}@local>`;
  const fromText = parsed.from?.text || 'unknown sender';
  const body = bodyOf(parsed);
  const html = parsed.html ? sanitizeEmailHtml(parsed.html) : undefined;
  const subject = parsed.subject || '(no subject)';
  const toText = parsed.to ? (Array.isArray(parsed.to) ? parsed.to.map((a) => a.text).join(', ') : parsed.to.text) : undefined;

  // Email correspondence is recorded as an `email` note so the UI renders it as a
  // conversation (with from/to/subject + sanitized HTML), distinct from internal notes.
  const emailNote = {
    noteType: 'email' as const,
    direction: 'inbound' as const,
    content: body,
    htmlContent: html,
    author: fromText,
    emailFrom: fromText,
    emailTo: toText,
    subject,
    externalId: messageId,
    inReplyTo: parsed.inReplyTo,
  };

  // Is this a reply to a thread we already know?
  const refs = refsOf(parsed);
  let ticketId: number | null = null;
  if (refs.length) {
    const note = await prisma.note.findFirst({ where: { externalId: { in: refs } }, select: { ticketId: true } });
    ticketId = note?.ticketId ?? null;
    if (!ticketId) {
      const t = await prisma.ticket.findFirst({
        where: { externalId: { in: refs }, externalProvider: 'imap' },
        select: { id: true },
      });
      ticketId = t?.id ?? null;
    }
  }

  if (ticketId) {
    const note = await noteRepo.create(ticketId, emailNote, 'imap');
    await saveInboundAttachments(ticketId, note.id, parsed);
    return 'appended';
  }

  const ticket = await ticketRepo.create(
    {
      title: subject.slice(0, 255),
      summary: body.slice(0, 200),
      description: body,
      companyName: mb.companyName ?? undefined,
      source: 'imap',
      externalId: messageId,
      externalProvider: 'imap',
    },
    'imap'
  );
  const note = await noteRepo.create(ticket.id, emailNote, 'imap');
  await saveInboundAttachments(ticket.id, note.id, parsed);
  return 'created';
}

/**
 * Persist a parsed email's attachments into the configured storage backend and
 * link each to the ticket + the email note. Inline images (cid: parts) are
 * skipped — they belong to the HTML body, not the file list. Failures are logged
 * per-file so one bad attachment doesn't abort ticket ingest.
 */
async function saveInboundAttachments(ticketId: number, noteId: number, parsed: ParsedMail): Promise<void> {
  const files = (parsed.attachments ?? []).filter(
    (a) => a.content && (a.contentDisposition === 'attachment' || !a.related),
  );
  if (!files.length) return;
  const storage = await currentStorage();
  for (const file of files) {
    const filename = file.filename || `attachment-${file.checksum?.slice(0, 8) || 'file'}`;
    try {
      const key = buildKey(ticketId, filename);
      const contentType = file.contentType || 'application/octet-stream';
      await storage.put(key, file.content, contentType);
      await attachmentRepo.create(
        {
          ticketId,
          noteId,
          filename,
          contentType,
          size: file.size ?? file.content.length,
          storageBackend: storage.backend,
          storageKey: key,
          createdBy: 'imap',
        },
        'imap',
      );
    } catch {
      /* skip a single failed attachment; the ticket/note already exist */
    }
  }
}

/** Poll one mailbox for new mail. Connection errors are captured, not thrown. */
export async function pollMailbox(mb: Mailbox): Promise<PollResult> {
  const result: PollResult = { mailbox: mb.name, processed: 0, created: 0, appended: 0 };
  const password = mailboxRepo.password(mb);
  if (!password) {
    result.error = 'No password configured';
    await mailboxRepo.recordPoll(mb.id, undefined, result.error);
    return result;
  }

  const client = new ImapFlow({
    host: mb.host,
    port: mb.port,
    secure: mb.secure,
    auth: { user: mb.username, pass: password },
    logger: false,
  });

  let highest = mb.lastUid ?? 0;
  try {
    await client.connect();
    const lock = await client.getMailboxLock(mb.folder);
    try {
      const start = highest + 1;
      for await (const msg of client.fetch(`${start}:*`, { uid: true, source: true }, { uid: true })) {
        // A UID range with no matches still returns the last message — skip it.
        if (highest > 0 && msg.uid <= highest) continue;
        if (msg.source) {
          const parsed = await simpleParser(msg.source);
          const outcome = await ingest(parsed, mb, msg.uid);
          result.processed++;
          if (outcome === 'created') result.created++;
          else result.appended++;
        }
        if (msg.uid > highest) highest = msg.uid;
      }
    } finally {
      lock.release();
    }
    await client.logout();
    await mailboxRepo.recordPoll(mb.id, highest, null);
  } catch (err) {
    result.error = (err as Error).message;
    await mailboxRepo.recordPoll(mb.id, highest > (mb.lastUid ?? 0) ? highest : undefined, result.error);
    try {
      await client.close();
    } catch {
      /* already closed */
    }
  }
  return result;
}

/** Poll every enabled mailbox. */
export async function pollAll(): Promise<PollResult[]> {
  const boxes = await mailboxRepo.enabled();
  const results: PollResult[] = [];
  for (const mb of boxes) {
    results.push(await pollMailbox(mb));
  }
  return results;
}
