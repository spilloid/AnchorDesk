import { Readable } from 'stream';

/**
 * Strategy interface for attachment byte storage. Mirrors the other pluggable
 * seams (`TicketProvider`, `MailTransport`): the database holds metadata, an
 * implementation of this interface holds the bytes. Concrete backends:
 * `LocalDiskStorage` (default) and `S3Storage` (any S3-compatible store).
 *
 * `backend` is persisted on each Attachment row so downloads resolve against the
 * backend that actually wrote the object, even after the admin switches stores.
 */
export interface AttachmentStorage {
  readonly backend: 'local' | 's3';
  /** Persist bytes under `key`. */
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  /** Stream bytes back out for `key`. */
  get(key: string): Promise<Readable>;
  /** Remove the object. Missing objects resolve without error. */
  delete(key: string): Promise<void>;
}
