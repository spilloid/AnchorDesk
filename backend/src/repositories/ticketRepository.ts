import { Prisma, TicketSource } from '@prisma/client';
import { prisma } from '../db/prisma';
import * as audit from './auditRepository';

export interface TicketListOptions {
  status?: string;
  assignee?: string;
  companyName?: string;
  source?: TicketSource;
  page?: number;
  pageSize?: number;
}

export interface CreateTicketInput {
  title: string;
  summary?: string;
  description?: string;
  status?: string;
  priority?: string;
  companyName?: string;
  companyId?: number | null;
  contactId?: number | null;
  assignee?: string;
  assigneeId?: number;
  source?: TicketSource;
  ticketNumber?: string;
  externalId?: string;
  externalProvider?: string;
}

export interface UpdateTicketInput {
  title?: string;
  summary?: string;
  description?: string;
  status?: string;
  priority?: string;
  companyName?: string;
  companyId?: number | null;
  contactId?: number | null;
  assignee?: string;
  assigneeId?: number | null;
  closedAt?: Date | null;
}

/** Resolve a Company's name so we can keep ticket.companyName denormalized. */
async function companyNameFor(companyId?: number | null): Promise<string | undefined> {
  if (!companyId) return undefined;
  const c = await prisma.company.findUnique({ where: { id: companyId }, select: { name: true } });
  return c?.name ?? undefined;
}

export async function list(opts: TicketListOptions = {}) {
  const { page = 1, pageSize = 100, ...filters } = opts;
  const where: Prisma.TicketWhereInput = {};

  if (filters.status) where.status = filters.status;
  if (filters.assignee) where.assignee = { contains: filters.assignee };
  if (filters.companyName) where.companyName = { contains: filters.companyName };
  if (filters.source) where.source = filters.source;

  return prisma.ticket.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: { assigneeUser: true },
  });
}

export async function getById(id: number) {
  return prisma.ticket.findUnique({
    where: { id },
    include: { assigneeUser: true, company: true, contact: true, notes: { orderBy: { createdAt: 'desc' } } },
  });
}

/** Tickets for a company (by FK), most recent first. */
export function listForCompany(companyId: number) {
  return prisma.ticket.findMany({
    where: { companyId, status: { not: 'Deleted' } },
    orderBy: { createdAt: 'desc' },
    include: { assigneeUser: true, contact: true },
  });
}

/**
 * Full-text ticket search (Postgres). Uses websearch_to_tsquery so users can
 * type natural queries ("printer offline -resolved") and ranks by relevance.
 * Backed by the GIN index in pgExtras (idx_tickets_fts).
 */
export async function search(q: string, limit = 50) {
  const term = q.trim();
  if (!term) return [];
  const rows = await prisma.$queryRaw<Array<{ id: number }>>(Prisma.sql`
    SELECT id
    FROM tickets
    WHERE status <> 'Deleted'
      AND to_tsvector('english',
            coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' ||
            coalesce(description,'') || ' ' || coalesce(company_name,''))
          @@ websearch_to_tsquery('english', ${term})
    ORDER BY ts_rank(
      to_tsvector('english',
        coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' ||
        coalesce(description,'') || ' ' || coalesce(company_name,'')),
      websearch_to_tsquery('english', ${term})
    ) DESC
    LIMIT ${limit}
  `);
  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return [];
  // Re-hydrate full records, preserving rank order.
  const tickets = await prisma.ticket.findMany({ where: { id: { in: ids } }, include: { assigneeUser: true } });
  const byId = new Map(tickets.map((t) => [t.id, t]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

export async function create(input: CreateTicketInput, actorSub: string) {
  // If linked to a Company, keep companyName in sync with the Company record.
  const companyName = input.companyId ? await companyNameFor(input.companyId) : input.companyName;
  const ticket = await prisma.ticket.create({
    data: {
      title: input.title,
      summary: input.summary,
      description: input.description,
      status: input.status ?? 'New',
      priority: input.priority,
      companyName,
      companyId: input.companyId ?? undefined,
      contactId: input.contactId ?? undefined,
      assignee: input.assignee,
      assigneeId: input.assigneeId,
      source: input.source ?? 'local',
      ticketNumber: input.ticketNumber,
      externalId: input.externalId,
      externalProvider: input.externalProvider,
    },
  });

  await audit.record({
    entityType: 'ticket',
    entityId: ticket.id,
    action: 'create',
    changedBy: actorSub,
    newValue: ticket as unknown as Record<string, unknown>,
  });

  return ticket;
}

export async function update(id: number, input: UpdateTicketInput, actorSub: string) {
  const before = await prisma.ticket.findUnique({ where: { id } });
  if (!before) return null;

  const data: Prisma.TicketUncheckedUpdateInput = { ...input };
  // Re-denormalize companyName when the company link changes.
  if (input.companyId !== undefined) {
    data.companyName = input.companyId ? await companyNameFor(input.companyId) : null;
  }

  const ticket = await prisma.ticket.update({ where: { id }, data });

  await audit.record({
    entityType: 'ticket',
    entityId: id,
    action: 'update',
    changedBy: actorSub,
    oldValue: before as unknown as Record<string, unknown>,
    newValue: ticket as unknown as Record<string, unknown>,
  });

  return ticket;
}

/** Soft-delete: sets status to 'Deleted' rather than hard-removing the row. */
export async function remove(id: number, actorSub: string) {
  const before = await prisma.ticket.findUnique({ where: { id } });
  if (!before) return null;

  const ticket = await prisma.ticket.update({
    where: { id },
    data: { status: 'Deleted', closedAt: new Date() },
  });

  await audit.record({
    entityType: 'ticket',
    entityId: id,
    action: 'delete',
    changedBy: actorSub,
    oldValue: before as unknown as Record<string, unknown>,
  });

  return ticket;
}

/** Upsert a ticket from an external sync source. Returns {ticket, created}. */
export async function upsertExternal(
  externalId: string,
  externalProvider: string,
  input: CreateTicketInput,
  actorSub: string
) {
  const existing = await prisma.ticket.findUnique({
    where: { externalId_externalProvider: { externalId, externalProvider } },
  });

  if (existing) {
    const ticket = await update(existing.id, input as UpdateTicketInput, actorSub);
    return { ticket, created: false };
  }

  const ticket = await create({ ...input, externalId, externalProvider }, actorSub);
  return { ticket, created: true };
}
