/**
 * CRM routes: companies + their contacts, plus company rollups (tickets,
 * devices, logged time). Reads/writes follow baseline RBAC (readonly can't
 * mutate); deleting a company is admin-only since it detaches tickets/devices.
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { requireRole } from '../middleware/auth';
import * as companyRepo from '../repositories/companyRepository';
import * as ticketRepo from '../repositories/ticketRepository';

interface IdParam {
  id: string;
}

export async function companyRoutes(server: FastifyInstance) {
  // ─── Companies ────────────────────────────────────────────────────────────
  server.get('/companies', async (_req, reply) => {
    return reply.send(await companyRepo.list());
  });

  server.get<{ Params: IdParam }>('/companies/:id', async (req, reply) => {
    const company = await companyRepo.getById(parseInt(req.params.id, 10));
    if (!company) return reply.status(404).send({ error: 'company not found' });
    return reply.send(company);
  });

  server.post('/companies', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = (req.body ?? {}) as companyRepo.CompanyInput;
    if (!body.name?.trim()) return reply.status(400).send({ error: 'name is required' });
    const existing = await companyRepo.findByName(body.name.trim());
    if (existing) return reply.status(409).send({ error: 'a company with that name already exists' });
    const company = await companyRepo.create(body, req.actorSub);
    return reply.status(201).send(company);
  });

  server.patch<{ Params: IdParam }>('/companies/:id', async (req, reply) => {
    const company = await companyRepo.update(parseInt(req.params.id, 10), (req.body ?? {}) as companyRepo.CompanyInput, req.actorSub);
    return reply.send(company);
  });

  server.delete<{ Params: IdParam }>('/companies/:id', { preHandler: requireRole('admin') }, async (req, reply) => {
    const company = await companyRepo.remove(parseInt(req.params.id, 10), req.actorSub);
    if (!company) return reply.status(404).send({ error: 'company not found' });
    return reply.status(204).send();
  });

  // ─── Company rollups ────────────────────────────────────────────────────────
  server.get<{ Params: IdParam }>('/companies/:id/tickets', async (req, reply) => {
    return reply.send(await ticketRepo.listForCompany(parseInt(req.params.id, 10)));
  });

  server.get<{ Params: IdParam }>('/companies/:id/devices', async (req, reply) => {
    return reply.send(await companyRepo.devicesForCompany(parseInt(req.params.id, 10)));
  });

  server.get<{ Params: IdParam }>('/companies/:id/time', async (req, reply) => {
    const minutes = await companyRepo.timeTotalMinutes(parseInt(req.params.id, 10));
    return reply.send({ minutes });
  });

  // ─── Contacts ─────────────────────────────────────────────────────────────
  server.post<{ Params: IdParam }>('/companies/:id/contacts', async (req, reply) => {
    const body = (req.body ?? {}) as Omit<companyRepo.ContactInput, 'companyId'>;
    if (!body.name?.trim()) return reply.status(400).send({ error: 'name is required' });
    const contact = await companyRepo.createContact({ ...body, companyId: parseInt(req.params.id, 10) }, req.actorSub);
    return reply.status(201).send(contact);
  });

  server.patch<{ Params: IdParam }>('/contacts/:id', async (req, reply) => {
    const contact = await companyRepo.updateContact(parseInt(req.params.id, 10), (req.body ?? {}) as companyRepo.ContactInput, req.actorSub);
    return reply.send(contact);
  });

  server.delete<{ Params: IdParam }>('/contacts/:id', async (req, reply) => {
    const contact = await companyRepo.removeContact(parseInt(req.params.id, 10), req.actorSub);
    if (!contact) return reply.status(404).send({ error: 'contact not found' });
    return reply.status(204).send();
  });
}
