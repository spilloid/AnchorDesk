import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as notificationRepo from '../repositories/notificationRepository';

interface IdParam { id: string }

export async function notificationRoutes(server: FastifyInstance) {
  // Current user's notifications (most recent first).
  server.get('/notifications', async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as Record<string, string>;
    const items = await notificationRepo.listForUser(req.user.id, {
      unreadOnly: query.unreadOnly === 'true',
      limit: query.limit ? parseInt(query.limit) : undefined,
    });
    const unread = await notificationRepo.unreadCount(req.user.id);
    return reply.send({ items, unread });
  });

  // Unread badge count.
  server.get('/notifications/unread-count', async (req: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ unread: await notificationRepo.unreadCount(req.user.id) });
  });

  // Mark one notification read.
  server.post('/notifications/:id/read', async (req: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    await notificationRepo.markRead(parseInt(req.params.id), req.user.id);
    return reply.send({ unread: await notificationRepo.unreadCount(req.user.id) });
  });

  // Mark all read.
  server.post('/notifications/read-all', async (req: FastifyRequest, reply: FastifyReply) => {
    await notificationRepo.markAllRead(req.user.id);
    return reply.send({ unread: 0 });
  });
}
