import { prisma } from '../db/prisma';

export interface CreateNotificationInput {
  userId: number;
  type: string;
  ticketId?: number;
  title: string;
  body?: string;
}

export function create(input: CreateNotificationInput) {
  return prisma.notification.create({ data: input });
}

export function listForUser(userId: number, opts: { unreadOnly?: boolean; limit?: number } = {}) {
  return prisma.notification.findMany({
    where: { userId, ...(opts.unreadOnly ? { readAt: null } : {}) },
    orderBy: { createdAt: 'desc' },
    take: Math.min(opts.limit ?? 50, 200),
  });
}

export function unreadCount(userId: number) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

/** Mark one notification read (scoped to its owner). */
export function markRead(id: number, userId: number) {
  return prisma.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
}

export function markAllRead(userId: number) {
  return prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
}
