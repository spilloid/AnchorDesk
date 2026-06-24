/**
 * Interface preferences shared by every user (the `ui` settings row).
 *
 * Unlike integration settings (admin-only, secret-bearing), these are read by
 * any authenticated user — the client needs them to render the right nav/views.
 * Writes stay admin-only.
 */
import { FastifyInstance } from 'fastify';
import { requireRole } from '../middleware/auth';
import * as settings from '../services/settingsService';

export async function uiSettingsRoutes(server: FastifyInstance) {
  // Any authenticated user can read interface prefs (drives nav/view gating).
  server.get('/ui-settings', async (_req, reply) => {
    return reply.send(await settings.getUi());
  });

  // Only admins change them.
  server.patch('/ui-settings', { preHandler: requireRole('admin') }, async (req, reply) => {
    await settings.updateSetting('ui', (req.body ?? {}) as Record<string, unknown>);
    return reply.send(await settings.getUi());
  });
}
