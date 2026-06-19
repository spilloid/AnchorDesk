/**
 * deviceSyncService — pulls devices from a DeviceProvider into the local table.
 *
 * netviz is push-based (probes POST to us), but RMMs like Tactical are pull-based,
 * so this runs a fetch + upsert cycle on demand (admin "Sync from Tactical").
 */

import { DeviceProvider } from '../providers/DeviceProvider';
import { TacticalRmmProvider } from '../providers/TacticalRmmProvider';
import * as deviceRepo from '../repositories/deviceRepository';
import { DeviceSource } from '@prisma/client';

export interface DeviceSyncResult {
  provider: string;
  created: number;
  updated: number;
  errors: string[];
  durationMs: number;
}

async function syncProvider(
  provider: DeviceProvider,
  source: DeviceSource,
  actorSub: string
): Promise<DeviceSyncResult> {
  const start = Date.now();
  const result: DeviceSyncResult = { provider: provider.name, created: 0, updated: 0, errors: [], durationMs: 0 };

  if (!provider.fetchDevices) {
    result.errors.push(`${provider.name} does not support pull sync`);
    result.durationMs = Date.now() - start;
    return result;
  }

  let devices;
  try {
    devices = await provider.fetchDevices();
  } catch (err) {
    result.errors.push((err as Error).message);
    result.durationMs = Date.now() - start;
    return result;
  }

  for (const ext of devices) {
    try {
      const { created } = await deviceRepo.upsertExternal(
        ext.externalId,
        provider.name,
        {
          hostname: ext.hostname,
          displayName: ext.displayName,
          ipAddress: ext.ipAddress,
          macAddress: ext.macAddress,
          vendor: ext.vendor,
          os: ext.os,
          deviceType: ext.deviceType,
          openPorts: ext.openPorts,
          status: ext.status,
          companyName: ext.companyName,
          source,
          lastSeenAt: ext.lastSeenAt ?? new Date(),
          metadata: ext.metadata,
        },
        actorSub
      );
      created ? result.created++ : result.updated++;
    } catch (err) {
      result.errors.push(`${ext.externalId}: ${(err as Error).message}`);
    }
  }

  result.durationMs = Date.now() - start;
  return result;
}

export function syncTactical(actorSub: string): Promise<DeviceSyncResult> {
  return syncProvider(new TacticalRmmProvider(), 'tactical_rmm', actorSub);
}
