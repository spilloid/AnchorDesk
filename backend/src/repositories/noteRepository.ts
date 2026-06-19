import { NoteType } from '@prisma/client';
import { prisma } from '../db/prisma';
import * as audit from './auditRepository';

export interface CreateNoteInput {
  content: string;
  author: string;
  authorId?: number;
  noteType?: NoteType;
  timeStart?: Date;
  timeStop?: Date;
  externalId?: string;
}

export interface UpdateNoteInput {
  content?: string;
  timeStart?: Date | null;
  timeStop?: Date | null;
}

export async function listForTicket(ticketId: number) {
  return prisma.note.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'asc' },
    include: { authorUser: true },
  });
}

export async function create(ticketId: number, input: CreateNoteInput, actorSub: string) {
  const note = await prisma.note.create({
    data: {
      ticketId,
      content: input.content,
      author: input.author,
      authorId: input.authorId,
      noteType: input.noteType ?? 'note',
      timeStart: input.timeStart,
      timeStop: input.timeStop,
      externalId: input.externalId,
    },
  });

  await audit.record({
    entityType: 'note',
    entityId: note.id,
    action: 'create',
    changedBy: actorSub,
    newValue: note as unknown as Record<string, unknown>,
  });

  return note;
}

export async function update(id: number, input: UpdateNoteInput, actorSub: string) {
  const before = await prisma.note.findUnique({ where: { id } });
  if (!before) return null;

  const note = await prisma.note.update({
    where: { id },
    data: { ...input },
  });

  await audit.record({
    entityType: 'note',
    entityId: id,
    action: 'update',
    changedBy: actorSub,
    oldValue: before as unknown as Record<string, unknown>,
    newValue: note as unknown as Record<string, unknown>,
  });

  return note;
}

export async function remove(id: number, actorSub: string) {
  const before = await prisma.note.findUnique({ where: { id } });
  if (!before) return null;

  await prisma.note.delete({ where: { id } });

  await audit.record({
    entityType: 'note',
    entityId: id,
    action: 'delete',
    changedBy: actorSub,
    oldValue: before as unknown as Record<string, unknown>,
  });

  return before;
}
