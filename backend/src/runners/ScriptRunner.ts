/**
 * ScriptRunner — Strategy interface for executing/scheduling scripts against a
 * device through whatever RMM owns it.
 *
 * This is the "act on machines" half of the product thesis: a ticket links to a
 * device, and from the card you run or schedule a script. The runner is chosen
 * by the device's source (tactical_rmm, meshcentral, ...). Standalone devices
 * (source = local / netviz) have no runner — scripts require a real RMM.
 *
 * STATUS: seam only. No concrete runner is implemented yet — the RMM cockpit is
 * the marquee feature of the next major. See docs/providers.md.
 *
 * GoF pattern: Strategy
 */

export interface ScriptInvocation {
  /** Device this runs against (devices.id). */
  deviceId: number;
  /** The RMM's own id for this device (e.g. Tactical agent_id). */
  externalDeviceId: string;
  /** Script identifier in the target RMM (e.g. Tactical script pk). */
  script: string;
  /** Arguments passed to the script. */
  args?: string[];
  /** Seconds before the RMM aborts the script. */
  timeout?: number;
  /** ISO timestamp to run at; omit to run immediately. */
  scheduledFor?: Date;
}

export interface ScriptResult {
  invocationId: string;
  status: 'queued' | 'running' | 'success' | 'error';
  output?: string;
  exitCode?: number;
}

export interface ScriptRunner {
  /** RMM key this runner targets (matches DeviceSource, e.g. 'tactical_rmm'). */
  readonly name: string;

  /** Run a script now. */
  run(invocation: ScriptInvocation): Promise<ScriptResult>;

  /** Schedule a script for later. Optional — not every RMM supports scheduling. */
  schedule?(invocation: ScriptInvocation): Promise<ScriptResult>;

  /** Poll the status of a previously queued/scheduled invocation. */
  getResult?(invocationId: string): Promise<ScriptResult>;
}
