import { prisma } from '../db/prisma';
import * as audit from './auditRepository';

export interface CreateAttachmentInput {
  ticketId: number;
  noteId?: number;
  filename: string;
  contentType: string;
  size: number;
  storageBackend: string;
  storageKey: string;
  createdBy?: string;
}

export function listForTicket(ticketId: number) {
  return prisma.attachment.findMany({ where: { ticketId }, orderBy: { createdAt: 'asc' } });
}

export function getById(id: number) {
  return prisma.attachment.findUnique({ where: { id } });
}

/** Fetch attachments by id, scoped to a ticket (drops ids that don't belong). */
export function listByIds(ticketId: number, ids: number[]) {
  return prisma.attachment.findMany({ where: { id: { in: ids }, ticketId } });
}

/** Link previously-uploaded attachments to the email note that sent them. */
export function attachToNote(ids: number[], noteId: number) {
  return prisma.attachment.updateMany({ where: { id: { in: ids } }, data: { noteId } });
}

export async function create(input: CreateAttachmentInput, actorSub: string) {
  const attachment = await prisma.attachment.create({ data: input });
  await audit.record({
    entityType: 'attachment',
    entityId: attachment.id,
    action: 'create',
    changedBy: actorSub,
    newValue: { ticketId: attachment.ticketId, filename: attachment.filename, size: attachment.size },
  });
  return attachment;
}

export async function remove(id: number, actorSub: string) {
  const before = await prisma.attachment.findUnique({ where: { id } });
  if (!before) return null;
  await prisma.attachment.delete({ where: { id } });
  await audit.record({
    entityType: 'attachment',
    entityId: id,
    action: 'delete',
    changedBy: actorSub,
    oldValue: { ticketId: before.ticketId, filename: before.filename },
  });
  return before;
}
