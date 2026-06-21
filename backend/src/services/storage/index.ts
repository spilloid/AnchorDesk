import path from 'path';
import { randomUUID } from 'crypto';
import { AttachmentStorage } from './AttachmentStorage';
import { LocalDiskStorage } from './LocalDiskStorage';
import { S3Storage } from './S3Storage';
import { getStorage } from '../settingsService';

export type { AttachmentStorage } from './AttachmentStorage';

/**
 * Resolves a storage backend instance. Instances are constructed from the
 * current (DB-backed) storage config; uploads use the configured default while
 * downloads/deletes pass the backend recorded on the row, so objects written
 * before an admin switched stores are still served by their original backend.
 */
async function storageFor(backend: 'local' | 's3'): Promise<AttachmentStorage> {
  const cfg = await getStorage();
  if (backend === 's3') return new S3Storage(cfg);
  return new LocalDiskStorage(cfg.localDir);
}

/** The backend new uploads are written to (the admin-selected default). */
export async function currentStorage(): Promise<AttachmentStorage> {
  const cfg = await getStorage();
  return storageFor(cfg.backend);
}

/** The backend that holds an already-stored object. */
export function storageForBackend(backend: string): Promise<AttachmentStorage> {
  return storageFor(backend === 's3' ? 's3' : 'local');
}

/** Read a stored object fully into a Buffer (used for re-attaching to email). */
export async function readToBuffer(backend: string, key: string): Promise<Buffer> {
  const storage = await storageForBackend(backend);
  const stream = await storage.get(key);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

/** Build a collision-free, traversal-safe storage key for a ticket attachment. */
export function buildKey(ticketId: number, filename: string): string {
  const safe = path
    .basename(filename)
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(-120);
  return `tickets/${ticketId}/${randomUUID()}-${safe || 'file'}`;
}
