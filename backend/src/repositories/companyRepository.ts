/**
 * Company + Contact DB access (the CRM layer). All mutations record to the
 * append-only audit log so company/contact changes are attributable.
 */
import { Company, Contact, Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import * as audit from './auditRepository';

// ─── Companies ───────────────────────────────────────────────────────────────

export function list(): Promise<(Company & { _count: { tickets: number; contacts: number; devices: number } })[]> {
  return prisma.company.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { tickets: true, contacts: true, devices: true } } },
  });
}

export function getById(id: number) {
  return prisma.company.findUnique({
    where: { id },
    include: { contacts: { orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }] } },
  });
}

export function findByName(name: string): Promise<Company | null> {
  return prisma.company.findUnique({ where: { name } });
}

export interface CompanyInput {
  name: string;
  domain?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  notes?: string;
}

export async function create(input: CompanyInput, actor: string): Promise<Company> {
  const company = await prisma.company.create({ data: { ...input, name: input.name.trim() } });
  await audit.record({ entityType: 'company', entityId: company.id, action: 'create', changedBy: actor, newValue: { name: company.name } });
  return company;
}

/** Find a company by name (case-insensitive) or create it. Used by the picker's
 *  "create new" and by future sync backfill. */
export async function findOrCreateByName(name: string, actor: string): Promise<Company> {
  const trimmed = name.trim();
  const existing = await prisma.company.findFirst({ where: { name: { equals: trimmed, mode: 'insensitive' } } });
  if (existing) return existing;
  return create({ name: trimmed }, actor);
}

export async function update(id: number, input: Partial<CompanyInput>, actor: string): Promise<Company> {
  const company = await prisma.company.update({ where: { id }, data: input as Prisma.CompanyUpdateInput });
  // Keep denormalized ticket/device companyName in sync if the name changed.
  if (input.name) {
    await prisma.ticket.updateMany({ where: { companyId: id }, data: { companyName: company.name } });
    await prisma.device.updateMany({ where: { companyId: id }, data: { companyName: company.name } });
  }
  await audit.record({ entityType: 'company', entityId: id, action: 'update', changedBy: actor, newValue: { name: company.name } });
  return company;
}

export async function remove(id: number, actor: string): Promise<Company | null> {
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) return null;
  await prisma.company.delete({ where: { id } });
  await audit.record({ entityType: 'company', entityId: id, action: 'delete', changedBy: actor, oldValue: { name: company.name } });
  return company;
}

export function devicesForCompany(companyId: number) {
  return prisma.device.findMany({ where: { companyId }, orderBy: { hostname: 'asc' } });
}

/** Total logged time (minutes) across all of a company's tickets. */
export async function timeTotalMinutes(companyId: number): Promise<number> {
  const r = await prisma.note.aggregate({
    where: { noteType: 'time_entry', ticket: { companyId } },
    _sum: { minutes: true },
  });
  return r._sum.minutes ?? 0;
}

// ─── Contacts ────────────────────────────────────────────────────────────────

export interface ContactInput {
  companyId: number;
  name: string;
  email?: string;
  phone?: string;
  title?: string;
  isPrimary?: boolean;
}

export async function createContact(input: ContactInput, actor: string): Promise<Contact> {
  const contact = await prisma.contact.create({ data: input });
  await audit.record({ entityType: 'contact', entityId: contact.id, action: 'create', changedBy: actor, newValue: { name: contact.name, companyId: contact.companyId } });
  return contact;
}

export async function updateContact(id: number, input: Partial<ContactInput>, actor: string): Promise<Contact> {
  const contact = await prisma.contact.update({ where: { id }, data: input });
  await audit.record({ entityType: 'contact', entityId: id, action: 'update', changedBy: actor, newValue: { name: contact.name } });
  return contact;
}

export async function removeContact(id: number, actor: string): Promise<Contact | null> {
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) return null;
  await prisma.contact.delete({ where: { id } });
  await audit.record({ entityType: 'contact', entityId: id, action: 'delete', changedBy: actor, oldValue: { name: contact.name } });
  return contact;
}
