import fastify from 'fastify';
import { ticketRoutes } from './routes/tickets';
import { deviceRoutes } from './routes/devices';
import { probeRoutes } from './routes/probes';
import { scriptRoutes } from './routes/scripts';
import { mailRoutes } from './routes/mail';
import { cwRoutes } from './routes/cw';
import { syncRoutes } from './routes/sync';
import { pingRoutes } from './routes/ping';
import { mcpRoutes } from './routes/mcp';
import { registerAuthHook } from './middleware/auth';
import { startScriptScheduler } from './services/scriptScheduler';
import { config } from './config/config';
import { prisma } from './db/prisma';

const server = fastify({ logger: true });

// OIDC bearer token auth — runs on every request except /ping
registerAuthHook(server);

// Parse JSON request bodies
server.addContentTypeParser('application/json', { parseAs: 'string' }, function (_req, body, done) {
  try {
    done(null, JSON.parse(body as string));
  } catch (err) {
    done(err as Error, undefined);
  }
});

// Core local-DB routes (tickets, notes, history)
server.register(ticketRoutes);

// Devices (local-first asset records + ticket linking)
server.register(deviceRoutes);

// Probes (netviz scanner registration + inbound device ingest)
server.register(probeRoutes);

// Scripts / RMM (Tactical device sync + run/schedule scripts on devices)
server.register(scriptRoutes);

// Outbound mail (SMTP relay) — send from a ticket, mail status for admin
server.register(mailRoutes);

// ConnectWise passthrough routes (auto-disabled when CWM_* env vars are absent)
server.register(cwRoutes);

// Sync management (trigger runs, view providers, view log)
server.register(syncRoutes);

// Health check
server.register(pingRoutes);

// MCP server — SSE transport at /mcp/sse, messages at /mcp/messages
server.register(mcpRoutes);

// Graceful shutdown — close HTTP server then disconnect Prisma
const shutdown = async () => {
  await server.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

server.listen({ port: Number(config.serverPort), host: '0.0.0.0' }, (err, address) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  server.log.info(`materialticket backend listening at ${address}`);
  // Poll for due scheduled script jobs.
  startScriptScheduler(server.log);
});
