/**
 * Pure RFC 5322 email-threading helpers (no DB/IO) so they can be unit-tested
 * and reasoned about in isolation. ticketMail composes these with repository
 * reads to thread outbound mail onto an existing ticket conversation.
 */
import { randomUUID } from 'crypto';

/**
 * Build the References chain for a reply: the thread root (if any) followed by
 * every prior Message-ID, de-duplicated and order-preserving. In-Reply-To is the
 * most recent message in the chain.
 */
export function buildReferenceChain(rootId: string | null, priorIds: (string | null)[]): {
  references: string[];
  inReplyTo?: string;
} {
  const chain: string[] = [];
  if (rootId) chain.push(rootId);
  for (const id of priorIds) {
    if (id && !chain.includes(id)) chain.push(id);
  }
  return { references: chain, inReplyTo: chain.length ? chain[chain.length - 1] : undefined };
}

/**
 * Subject token that carries the ticket number through an email round-trip, e.g.
 * `[#10042]`. Outbound mail prepends it; inbound parsing reads it back so a
 * customer reply re-threads onto the ticket even when References/In-Reply-To are
 * stripped by an intermediary.
 */
const TICKET_TAG_RE = /\[#(\d{4,6})\]/;

/** Prepend `[#<number>]` to a subject if a number exists and it isn't already tagged. */
export function tagSubjectWithTicket(subject: string, ticketNumber: string | null | undefined): string {
  if (!ticketNumber || TICKET_TAG_RE.test(subject)) return subject;
  return `[#${ticketNumber}] ${subject}`;
}

/** Extract a ticket number from an inbound subject (`[#NNNNN]`, falling back to a
 *  bare `#NNNNN`). Returns null when no token is present. */
export function ticketNumberFromSubject(subject: string | null | undefined): string | null {
  if (!subject) return null;
  const tagged = subject.match(TICKET_TAG_RE);
  if (tagged) return tagged[1];
  const bare = subject.match(/#(\d{4,6})\b/);
  return bare ? bare[1] : null;
}

/** Generate a Message-ID rooted on the sender address's domain. */
export function generateMessageId(fromAddress: string): string {
  const at = fromAddress.lastIndexOf('@');
  const domain = at >= 0 ? fromAddress.slice(at + 1).replace(/[>\s].*$/, '').trim() : '';
  return `<${randomUUID()}@${domain || 'anchordesk.local'}>`;
}
