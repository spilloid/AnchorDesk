import { Prisma, ScriptJobStatus } from '@prisma/client';
import { prisma } from '../db/prisma';
import * as audit from './auditRepository';

export interface CreateScriptJobInput {
  deviceId: number;
  ticketId?: number;
  runner: string;
  scriptRef: string;
  scriptName?: string;
  args?: string[];
  scheduledFor?: Date;
  createdBy?: string;
}

export async function create(input: CreateScriptJobInput, actorSub: string) {
  const job = await prisma.scriptJob.create({
    data: {
      deviceId: input.deviceId,
      ticketId: input.ticketId,
      runner: input.runner,
      scriptRef: input.scriptRef,
      scriptName: input.scriptName,
      args: (input.args as Prisma.InputJsonValue) ?? undefined,
      scheduledFor: input.scheduledFor,
      createdBy: input.createdBy ?? actorSub,
      status: 'queued',
    },
  });

  await audit.record({
    entityType: 'script_job',
    entityId: job.id,
    action: 'create',
    changedBy: actorSub,
    newValue: { deviceId: job.deviceId, scriptRef: job.scriptRef, scheduledFor: job.scheduledFor },
  });

  return job;
}

export async function markRunning(id: number) {
  return prisma.scriptJob.update({
    where: { id },
    data: { status: 'running', startedAt: new Date() },
  });
}

export async function markFinished(
  id: number,
  status: Extract<ScriptJobStatus, 'success' | 'error'>,
  output: string,
  exitCode?: number
) {
  return prisma.scriptJob.update({
    where: { id },
    data: { status, output, exitCode, completedAt: new Date() },
  });
}

export async function getById(id: number) {
  return prisma.scriptJob.findUnique({ where: { id } });
}

export async function listForDevice(deviceId: number, limit = 50) {
  return prisma.scriptJob.findMany({
    where: { deviceId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function listForTicket(ticketId: number, limit = 50) {
  return prisma.scriptJob.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/** Jobs that are queued and due to run (scheduledFor <= now, or immediate). */
export async function dueJobs(now: Date = new Date()) {
  return prisma.scriptJob.findMany({
    where: {
      status: 'queued',
      OR: [{ scheduledFor: null }, { scheduledFor: { lte: now } }],
    },
    orderBy: { createdAt: 'asc' },
    take: 25,
  });
}
