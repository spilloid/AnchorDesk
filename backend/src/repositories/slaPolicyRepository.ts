import { prisma } from '../db/prisma';

export interface SlaPolicyInput {
  name: string;
  priority?: string | null;
  companyId?: number | null;
  responseMinutes: number;
  resolutionMinutes: number;
  enabled?: boolean;
}

export function list() {
  return prisma.slaPolicy.findMany({ orderBy: [{ companyId: 'asc' }, { priority: 'asc' }] });
}

export function getById(id: number) {
  return prisma.slaPolicy.findUnique({ where: { id } });
}

export function create(input: SlaPolicyInput) {
  return prisma.slaPolicy.create({
    data: {
      name: input.name,
      priority: input.priority ?? null,
      companyId: input.companyId ?? null,
      responseMinutes: input.responseMinutes,
      resolutionMinutes: input.resolutionMinutes,
      enabled: input.enabled ?? true,
    },
  });
}

export function update(id: number, input: Partial<SlaPolicyInput>) {
  return prisma.slaPolicy.update({ where: { id }, data: input });
}

export function remove(id: number) {
  return prisma.slaPolicy.delete({ where: { id } });
}
