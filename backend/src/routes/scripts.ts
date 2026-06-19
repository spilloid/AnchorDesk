import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as tactical from '../services/tacticalService';
import * as scriptService from '../services/scriptService';
import * as scriptJobRepo from '../repositories/scriptJobRepository';
import { syncTactical } from '../services/deviceSyncService';

interface IdParam { id: string }

interface RunScriptBody {
  script: string | number;
  scriptName?: string;
  args?: string[];
  timeout?: number;
  ticketId?: number;
  scheduledFor?: string;
}

export async function scriptRoutes(server: FastifyInstance) {
  // Whether RMM features are usable (drives the UI).
  server.get('/rmm/status', async (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ tactical: { configured: tactical.isConfigured() } });
  });

  // Script catalog from Tactical (for the run-script picker).
  server.get('/scripts', async (_req: FastifyRequest, reply: FastifyReply) => {
    if (!tactical.isConfigured()) return reply.send([]);
    try {
      const scripts = await tactical.listScripts();
      return reply.send(scripts.map((s) => ({ id: s.id, name: s.name, shell: s.shell })));
    } catch (err) {
      return reply.status(502).send({ error: (err as Error).message });
    }
  });

  // Run (or schedule) a script against a device.
  server.post('/devices/:id/run-script', async (req: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    const body = req.body as RunScriptBody;
    if (body?.script == null) return reply.status(400).send({ error: 'script is required' });

    try {
      const job = await scriptService.runOrSchedule(
        {
          deviceId: parseInt(req.params.id),
          script: String(body.script),
          scriptName: body.scriptName,
          args: body.args,
          timeout: body.timeout,
          ticketId: body.ticketId,
          scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
        },
        req.actorSub
      );
      return reply.status(201).send(job);
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  // Script run history for a device.
  server.get('/devices/:id/script-jobs', async (req: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    const jobs = await scriptJobRepo.listForDevice(parseInt(req.params.id));
    return reply.send(jobs);
  });

  // Script runs launched from a ticket.
  server.get('/tickets/:id/script-jobs', async (req: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    const jobs = await scriptJobRepo.listForTicket(parseInt(req.params.id));
    return reply.send(jobs);
  });

  // Single job (poll a scheduled job's result).
  server.get('/script-jobs/:id', async (req: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    const job = await scriptJobRepo.getById(parseInt(req.params.id));
    if (!job) return reply.status(404).send({ error: 'Job not found' });
    return reply.send(job);
  });

  // Pull devices from Tactical into the local table.
  server.post('/devices/sync', async (req: FastifyRequest, reply: FastifyReply) => {
    if (!tactical.isConfigured()) return reply.status(503).send({ error: 'Tactical RMM is not configured' });
    const result = await syncTactical(req.actorSub);
    return reply.send(result);
  });
}
