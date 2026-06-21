/**
 * Live-update client. Maintains a single shared WebSocket to the backend
 * (cookie-authenticated on the upgrade request) and fans frames out to all
 * subscribers, so the notification bell and the ticket list reuse one socket.
 * Ticket/note frames drive reactive refreshes; notification frames feed the
 * bell; sla.atRisk lets SLA chips react. Reconnects with capped backoff.
 */
import type { NotificationItem } from "./client";

export type RealtimeEvent =
  | { type: "connected" }
  | { type: "notification"; notification: NotificationItem }
  | { type: "ticket.created"; ticketId: number }
  | { type: "ticket.updated"; ticketId: number }
  | { type: "ticket.deleted"; ticketId: number }
  | { type: "note.added"; ticketId: number }
  | { type: "sla.atRisk"; ticketId: number; level: "warning" | "breached"; kind: "response" | "resolution" };

type Handler = (event: RealtimeEvent) => void;

const handlers = new Set<Handler>();
let socket: WebSocket | null = null;
let retry = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function wsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/api/ws`;
}

function open() {
  socket = new WebSocket(wsUrl());
  socket.onmessage = (ev) => {
    let parsed: RealtimeEvent;
    try {
      parsed = JSON.parse(ev.data) as RealtimeEvent;
    } catch {
      return;
    }
    for (const h of handlers) h(parsed);
  };
  socket.onopen = () => {
    retry = 0;
  };
  socket.onclose = () => {
    socket = null;
    if (handlers.size === 0) return; // nobody listening — stop reconnecting
    const delay = Math.min(1000 * 2 ** retry, 30_000); // 1s → 30s cap
    retry += 1;
    reconnectTimer = setTimeout(open, delay);
  };
  socket.onerror = () => socket?.close();
}

/** Subscribe to live events. Opens the shared socket on first subscriber and
 *  closes it when the last one unsubscribes. Returns the unsubscribe function. */
export function subscribeRealtime(handler: Handler): () => void {
  handlers.add(handler);
  if (!socket) open();
  return () => {
    handlers.delete(handler);
    if (handlers.size === 0) {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = null;
      socket?.close();
      socket = null;
    }
  };
}
