import { AuditAction, Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';

/** Record a mutation event to the append-only audit log. */
export async function record(opts: {
  entityType: string;
  entityId: number;
  action: AuditAction;
  changedBy: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
}) {
  return prisma.auditLog.create({
    data: {
      entityType: opts.entityType,
      entityId: opts.entityId,
      action: opts.action,
      changedBy: opts.changedBy,
      oldValue: opts.oldValue as Prisma.InputJsonValue ?? Prisma.JsonNull,
      newValue: opts.newValue as Prisma.InputJsonValue ?? Prisma.JsonNull,
    },
  });
}

/** Fetch the full history for a single entity (most recent first). */
export async function getHistory(entityType: string, entityId: number) {
  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { occurredAt: 'desc' },
  });
}
