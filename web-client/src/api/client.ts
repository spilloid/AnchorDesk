/**
 * Thin API client for materialticket backend.
 *
 * All fetch calls go through here so auth headers, base URL,
 * and error handling are handled consistently in one place.
 *
 * Token injection: call setAuthToken() once after OIDC login;
 * every subsequent request will include the bearer header automatically.
 */

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(`/api${path}`, { ...init, headers });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${init.method ?? 'GET'} ${path} → ${res.status}: ${body}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Tickets ────────────────────────────────────────────────────────────────

export interface TicketFilters {
  status?: string;
  assignee?: string;
  company?: string;
  page?: number;
  pageSize?: number;
}

export function listTickets(filters: TicketFilters = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(
      Object.entries(filters)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    )
  );
  return request<unknown[]>(`/tickets?${params}`);
}

export function getTicket(id: number) {
  return request<unknown>(`/tickets/${id}`);
}

export function createTicket(data: Record<string, unknown>) {
  return request<unknown>('/tickets', { method: 'POST', body: JSON.stringify(data) });
}

export function updateTicket(id: number, data: Record<string, unknown>) {
  return request<unknown>(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function deleteTicket(id: number) {
  return request<void>(`/tickets/${id}`, { method: 'DELETE' });
}

export function getTicketHistory(id: number) {
  return request<unknown[]>(`/tickets/${id}/history`);
}

// ─── Notes ──────────────────────────────────────────────────────────────────

export function listNotes(ticketId: number) {
  return request<unknown[]>(`/tickets/${ticketId}/notes`);
}

export function createNote(ticketId: number, data: Record<string, unknown>) {
  return request<unknown>(`/tickets/${ticketId}/notes`, { method: 'POST', body: JSON.stringify(data) });
}

export function updateNote(ticketId: number, noteId: number, data: Record<string, unknown>) {
  return request<unknown>(`/tickets/${ticketId}/notes/${noteId}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function deleteNote(ticketId: number, noteId: number) {
  return request<void>(`/tickets/${ticketId}/notes/${noteId}`, { method: 'DELETE' });
}

// ─── Sync ────────────────────────────────────────────────────────────────────

export function listSyncProviders() {
  return request<unknown[]>('/sync/providers');
}

export function runSync(provider?: string) {
  const params = provider ? `?provider=${encodeURIComponent(provider)}` : '';
  return request<unknown>(`/sync/run${params}`, { method: 'POST' });
}

export function getSyncLog(opts: { provider?: string; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (opts.provider) params.set('provider', opts.provider);
  if (opts.limit) params.set('limit', String(opts.limit));
  return request<unknown[]>(`/sync/log?${params}`);
}

export function toggleSyncProvider(providerId: number, enabled: boolean) {
  return request<unknown>(`/sync/providers/${providerId}`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  });
}

// ─── Devices ──────────────────────────────────────────────────────────────────

export interface DeviceFilters {
  company?: string;
  source?: string;
  status?: string;
  probeId?: number;
  page?: number;
  pageSize?: number;
}

export function listDevices(filters: DeviceFilters = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(
      Object.entries(filters)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    )
  );
  return request<unknown[]>(`/devices?${params}`);
}

export function getDevice(id: number) {
  return request<unknown>(`/devices/${id}`);
}

export function createDevice(data: Record<string, unknown>) {
  return request<unknown>('/devices', { method: 'POST', body: JSON.stringify(data) });
}

export function updateDevice(id: number, data: Record<string, unknown>) {
  return request<unknown>(`/devices/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function deleteDevice(id: number) {
  return request<void>(`/devices/${id}`, { method: 'DELETE' });
}

export function listTicketDevices(ticketId: number) {
  return request<unknown[]>(`/tickets/${ticketId}/devices`);
}

export function linkDevice(ticketId: number, deviceId: number) {
  return request<unknown>(`/tickets/${ticketId}/devices`, {
    method: 'POST',
    body: JSON.stringify({ deviceId }),
  });
}

export function unlinkDevice(ticketId: number, deviceId: number) {
  return request<void>(`/tickets/${ticketId}/devices/${deviceId}`, { method: 'DELETE' });
}

// ─── Probes ───────────────────────────────────────────────────────────────────

export function listProbes() {
  return request<unknown[]>('/probes');
}

/** Returns the created probe INCLUDING its apiKey (shown once). */
export function createProbe(data: { name: string; kind?: string; companyName?: string; cidr?: string }) {
  return request<{ id: number; name: string; apiKey: string }>('/probes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteProbe(id: number) {
  return request<void>(`/probes/${id}`, { method: 'DELETE' });
}

// ─── Mail ─────────────────────────────────────────────────────────────────────

export function getMailStatus() {
  return request<{ configured: boolean; from: string; host: string | null; port: number; secure: boolean }>(
    '/mail/status'
  );
}

export function sendTicketEmail(
  ticketId: number,
  data: { to: string | string[]; subject: string; text?: string; html?: string; cc?: string[] }
) {
  return request<{ ok: boolean; messageId: string }>(`/tickets/${ticketId}/email`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── RMM / scripts ─────────────────────────────────────────────────────────────

export function getRmmStatus() {
  return request<{ tactical: { configured: boolean } }>('/rmm/status');
}

export function listScripts() {
  return request<{ id: number; name: string; shell?: string }[]>('/scripts');
}

export function syncDevices() {
  return request<{ provider: string; created: number; updated: number; errors: string[] }>('/devices/sync', {
    method: 'POST',
  });
}

export function runDeviceScript(
  deviceId: number,
  data: { script: string | number; scriptName?: string; args?: string[]; timeout?: number; ticketId?: number; scheduledFor?: string }
) {
  return request<unknown>(`/devices/${deviceId}/run-script`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function listDeviceScriptJobs(deviceId: number) {
  return request<unknown[]>(`/devices/${deviceId}/script-jobs`);
}

export function listTicketScriptJobs(ticketId: number) {
  return request<unknown[]>(`/tickets/${ticketId}/script-jobs`);
}

export function getScriptJob(id: number) {
  return request<unknown>(`/script-jobs/${id}`);
}
