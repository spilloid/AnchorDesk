import { promises as fs, createReadStream } from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { AttachmentStorage } from './AttachmentStorage';

/**
 * Stores attachment bytes on the local filesystem under a base directory. Keys
 * are relative paths (e.g. `tickets/12/ab12-report.pdf`); the base dir is created
 * on demand. Keys are sanitized against traversal before they touch disk.
 */
export class LocalDiskStorage implements AttachmentStorage {
  readonly backend = 'local' as const;

  constructor(private readonly baseDir: string) {}

  private resolve(key: string): string {
    const full = path.resolve(this.baseDir, key);
    const base = path.resolve(this.baseDir);
    if (full !== base && !full.startsWith(base + path.sep)) {
      throw new Error('Invalid storage key');
    }
    return full;
  }

  async put(key: string, body: Buffer): Promise<void> {
    const full = this.resolve(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, body);
  }

  async get(key: string): Promise<Readable> {
    const full = this.resolve(key);
    await fs.access(full); // throw early if missing
    return createReadStream(full);
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.resolve(key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }
}
