/**
 * WebSocket hub: tracks live browser connections per user and pushes domain
 * events to them. Ticket/note/SLA events broadcast to every connected user so
 * open lists, Kanban boards, and ticket views update reactively; notification
 * events go only to the target user's sockets.
 *
 * The hub subscribes to the in-process eventBus once (initWsHub) and fans events
 * out as small JSON frames the frontend's WS client switches on by `kind`.
 */
import type { WebSocket } from 'ws';
import { subscribe, DomainEvent } from './eventBus';

const clients = new Map<number, Set<WebSocket>>();

export function register(userId: number, socket: WebSocket): void {
  let set = clients.get(userId);
  if (!set) {
    set = new Set();
    clients.set(userId, set);
  }
  set.add(socket);
  socket.on('close', () => unregister(userId, socket));
  socket.on('error', () => unregister(userId, socket));
}

function unregister(userId: number, socket: WebSocket): void {
  const set = clients.get(userId);
  if (!set) return;
  set.delete(socket);
  if (set.size === 0) clients.delete(userId);
}

function frame(payload: unknown): string {
  return JSON.stringify(payload);
}

function broadcast(payload: unknown): void {
  const data = frame(payload);
  for (const set of clients.values()) {
    for (const socket of set) trySend(socket, data);
  }
}

function sendToUser(userId: number, payload: unknown): void {
  const set = clients.get(userId);
  if (!set) return;
  const data = frame(payload);
  for (const socket of set) trySend(socket, data);
}

function trySend(socket: WebSocket, data: string): void {
  if (socket.readyState === socket.OPEN) {
    try {
      socket.send(data);
    } catch {
      /* drop; close handler will clean up */
    }
  }
}

function route(event: DomainEvent): void {
  switch (event.type) {
    case 'ticket.created':
    case 'ticket.updated':
    case 'ticket.deleted':
    case 'note.added':
    case 'sla.atRisk':
      broadcast(event);
      break;
    case 'notification.created':
      sendToUser(event.userId, { type: 'notification', notification: event.notification });
      break;
  }
}

let started = false;

/** Subscribe the hub to the event bus. Call once at boot. */
export function initWsHub(): void {
  if (started) return;
  started = true;
  subscribe(route);
}
