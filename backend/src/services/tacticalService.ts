/**
 * tacticalService — thin HTTP client for the Tactical RMM REST API.
 *
 * Auth is a single API key in the X-API-KEY header (created in Tactical under
 * Settings > Global Settings > API Keys). Base URL is the instance's API host
 * with no /api prefix. Everything else in the app talks to Tactical only through
 * the TacticalRmmProvider / TacticalRmmRunner, which call this module.
 */

import { config } from '../config/config';

export function isConfigured(): boolean {
  return Boolean(config.trmm.apiUrl && config.trmm.apiKey);
}

async function trmm<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!isConfigured()) throw new Error('Tactical RMM is not configured (set TRMM_API_URL and TRMM_API_KEY)');

  const res = await fetch(`${config.trmm.apiUrl}${path}`, {
    ...init,
    headers: {
      'X-API-KEY': config.trmm.apiKey,
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string>),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Tactical ${init.method ?? 'GET'} ${path} → ${res.status}: ${body}`);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    // runscript "wait" mode can return a bare string of script output
    return text as unknown as T;
  }
}

/** Raw Tactical agent shape (subset we use). */
export interface TacticalAgent {
  agent_id: string;
  hostname?: string;
  operating_system?: string;
  plat?: string;
  status?: string; // 'online' | 'offline' | 'overdue'
  local_ips?: string;
  make_model?: string;
  client_name?: string;
  site_name?: string;
  monitoring_type?: string; // 'server' | 'workstation'
  last_seen?: string;
  public_ip?: string;
  serial_number?: string;
  cpu_model?: string[] | string;
  [key: string]: unknown;
}

export interface TacticalScript {
  id: number;
  name: string;
  shell?: string;
  description?: string;
  [key: string]: unknown;
}

export function listAgents(): Promise<TacticalAgent[]> {
  // Detailed list — the abbreviated (?detail=false) view omits os/status/ips/client.
  return trmm<TacticalAgent[]>('/agents/');
}

export function getAgent(agentId: string): Promise<TacticalAgent> {
  return trmm<TacticalAgent>(`/agents/${encodeURIComponent(agentId)}/`);
}

export function listScripts(): Promise<TacticalScript[]> {
  return trmm<TacticalScript[]>('/scripts/');
}

export interface RunScriptOptions {
  script: number;
  args?: string[];
  timeout?: number;
  run_as_user?: boolean;
  env_vars?: string[];
}

/** Run a script on an agent and wait for the output (synchronous mode). */
export async function runScript(agentId: string, opts: RunScriptOptions): Promise<string> {
  const result = await trmm<unknown>(`/agents/${agentId}/runscript/`, {
    method: 'POST',
    body: JSON.stringify({
      script: opts.script,
      args: opts.args ?? [],
      timeout: opts.timeout ?? 90,
      run_as_user: opts.run_as_user ?? false,
      output: 'wait',
      emails: [],
      emailMode: 'default',
      env_vars: opts.env_vars ?? [],
    }),
  });
  return typeof result === 'string' ? result : JSON.stringify(result);
}
