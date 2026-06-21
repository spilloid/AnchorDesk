import { Readable } from 'stream';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { AttachmentStorage } from './AttachmentStorage';
import type { StorageConfig } from '../settingsService';

/**
 * Stores attachment bytes in any S3-compatible object store: AWS S3, MinIO,
 * Cloudflare R2, Backblaze B2. For non-AWS providers set `s3Endpoint` and usually
 * `s3ForcePathStyle=true`. Objects are streamed both in and out so large files
 * don't buffer the whole body in memory on download.
 */
export class S3Storage implements AttachmentStorage {
  readonly backend = 's3' as const;
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(cfg: StorageConfig) {
    if (!cfg.s3Bucket) throw new Error('S3 storage selected but S3_BUCKET is not set');
    this.bucket = cfg.s3Bucket;
    this.client = new S3Client({
      region: cfg.s3Region || 'us-east-1',
      endpoint: cfg.s3Endpoint || undefined,
      forcePathStyle: cfg.s3ForcePathStyle,
      credentials:
        cfg.s3AccessKeyId && cfg.s3SecretAccessKey
          ? { accessKeyId: cfg.s3AccessKeyId, secretAccessKey: cfg.s3SecretAccessKey }
          : undefined, // fall back to ambient/IAM credentials
    });
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
    );
  }

  async get(key: string): Promise<Readable> {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    if (!res.Body) throw new Error(`Object not found: ${key}`);
    return res.Body as Readable;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
