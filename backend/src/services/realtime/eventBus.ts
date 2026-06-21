/**
 * In-process domain event bus (Observer pattern), the live-update counterpart to
 * the audit log. Repositories `publish()` after a mutation; subscribers — the
 * WebSocket hub and the notification service — react without the repositories
 * knowing they exist. Single-process only: if you scale to multiple backend
 * replicas, back this with Redis pub/sub (the publish/subscribe surface stays
 * the same).
 */
import { EventEmitter } from 'events';

export type DomainEvent =
  | { type: 'ticket.created'; ticketId: number; ticket: unknown; actor: string }
  | { type: 'ticket.updated'; ticketId: number; ticket: unknown; actor: string; changes?: Record<string, unknown> }
  | { type: 'ticket.deleted'; ticketId: number; actor: string }
  | { type: 'note.added'; ticketId: number; note: unknown; actor: string }
  | { type: 'sla.atRisk'; ticketId: number; level: 'warning' | 'breached'; kind: 'response' | 'resolution' }
  | { type: 'notification.created'; userId: number; notification: unknown };

const emitter = new EventEmitter();
emitter.setMaxListeners(50);

const CHANNEL = 'event';

export function publish(event: DomainEvent): void {
  emitter.emit(CHANNEL, event);
}

export function subscribe(handler: (event: DomainEvent) => void): () => void {
  emitter.on(CHANNEL, handler);
  return () => emitter.off(CHANNEL, handler);
}
