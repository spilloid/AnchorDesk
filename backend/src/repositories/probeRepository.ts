import { randomBytes } from 'crypto';
import { ProbeStatus } from '@prisma/client';
import { prisma } from '../db/prisma';
import * as audit from './auditRepository';

export interface CreateProbeInput {
  name: string;
  kind?: string;
  companyName?: string;
  cidr?: string;
}

/** Public-safe projection — never leak apiKey in list responses. */
const safeSelect = {
  id: true,
  name: true,
  kind: true,
  companyName: true,
  cidr: true,
  version: true,
  status: true,
  lastSeenAt: true,
  createdAt: true,
} as const;

export async function list() {
  return prisma.probe.findMany({ orderBy: { name: 'asc' }, select: safeSelect });
}

export async function getById(id: number) {
  return prisma.probe.findUnique({ where: { id }, select: safeSelect });
}

export async function findByApiKey(apiKey: string) {
  return prisma.probe.findUnique({ where: { apiKey } });
}

/** Register a probe. Returns the row INCLUDING apiKey — shown once at creation. */
export async function create(input: CreateProbeInput, actorSub: string) {
  const apiKey = randomBytes(24).toString('hex');
  const probe = await prisma.probe.create({
    data: {
      name: input.name,
      kind: input.kind ?? 'netviz',
      companyName: input.companyName,
      cidr: input.cidr,
      apiKey,
    },
  });

  await audit.record({
    entityType: 'probe',
    entityId: probe.id,
    action: 'create',
    changedBy: actorSub,
    newValue: { id: probe.id, name: probe.name, kind: probe.kind },
  });

  return probe; // includes apiKey
}

export async function remove(id: number, actorSub: string) {
  const before = await prisma.probe.findUnique({ where: { id }, select: safeSelect });
  if (!before) return null;

  await prisma.probe.delete({ where: { id } });

  await audit.record({
    entityType: 'probe',
    entityId: id,
    action: 'delete',
    changedBy: actorSub,
    oldValue: before as unknown as Record<string, unknown>,
  });

  return before;
}

/** Heartbeat from a probe — updates status/version/lastSeenAt. No audit (high-volume). */
export async function heartbeat(id: number, data: { status?: ProbeStatus; version?: string; cidr?: string }) {
  return prisma.probe.update({
    where: { id },
    data: {
      status: data.status ?? 'online',
      version: data.version,
      cidr: data.cidr,
      lastSeenAt: new Date(),
    },
    select: safeSelect,
  });
}
