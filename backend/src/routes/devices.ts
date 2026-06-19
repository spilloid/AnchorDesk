import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { DeviceSource } from '@prisma/client';
import * as deviceRepo from '../repositories/deviceRepository';
import * as audit from '../repositories/auditRepository';

interface IdParam { id: string }

export async function deviceRoutes(server: FastifyInstance) {
  // List devices with optional filtering
  server.get('/devices', async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as Record<string, string>;
    const devices = await deviceRepo.list({
      companyName: query.company,
      source: query.source as DeviceSource | undefined,
      status: query.status,
      probeId: query.probeId ? parseInt(query.probeId) : undefined,
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 100,
    });
    return reply.send(devices);
  });

  // Get one device with its ticket links
  server.get('/devices/:id', async (req: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    const device = await deviceRepo.getById(parseInt(req.params.id));
    if (!device) return reply.status(404).send({ error: 'Device not found' });
    return reply.send(device);
  });

  // Create a device manually (standalone — no RMM required)
  server.post('/devices', async (req: FastifyRequest, reply: FastifyReply) => {
    const device = await deviceRepo.create(req.body as deviceRepo.CreateDeviceInput, req.actorSub);
    return reply.status(201).send(device);
  });

  // Update device fields
  server.patch('/devices/:id', async (req: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    const device = await deviceRepo.update(
      parseInt(req.params.id),
      req.body as deviceRepo.UpdateDeviceInput,
      req.actorSub
    );
    if (!device) return reply.status(404).send({ error: 'Device not found' });
    return reply.send(device);
  });

  // Delete a device
  server.delete('/devices/:id', async (req: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    const device = await deviceRepo.remove(parseInt(req.params.id), req.actorSub);
    if (!device) return reply.status(404).send({ error: 'Device not found' });
    return reply.status(204).send();
  });

  // Device revision history
  server.get('/devices/:id/history', async (req: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    const history = await audit.getHistory('device', parseInt(req.params.id));
    return reply.send(history);
  });

  // --- ticket <-> device linking (the kanban card cockpit) ---

  // Devices linked to a ticket
  server.get('/tickets/:id/devices', async (req: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    const devices = await deviceRepo.listForTicket(parseInt(req.params.id));
    return reply.send(devices);
  });

  // Link a device to a ticket
  server.post('/tickets/:id/devices', async (req: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    const body = req.body as { deviceId?: number };
    if (!body?.deviceId) return reply.status(400).send({ error: 'deviceId is required' });

    await deviceRepo.link(parseInt(req.params.id), body.deviceId, req.actorSub);
    return reply.status(201).send({ ok: true });
  });

  // Unlink a device from a ticket
  server.delete('/tickets/:id/devices/:deviceId', async (
    req: FastifyRequest<{ Params: { id: string; deviceId: string } }>,
    reply: FastifyReply
  ) => {
    const ok = await deviceRepo.unlink(parseInt(req.params.id), parseInt(req.params.deviceId), req.actorSub);
    if (!ok) return reply.status(404).send({ error: 'Link not found' });
    return reply.status(204).send();
  });
}
