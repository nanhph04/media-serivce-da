import { Injectable } from '@nestjs/common';
import { Client } from 'minio';
import type { Readable } from 'stream';
import { ConfigService } from '../config/config.service';

@Injectable()
export class MinioService {
  private readonly client: Client;
  private readonly rawBucket: string;
  private readonly processedBucket: string;

  constructor(private readonly configService: ConfigService) {
    this.rawBucket = this.configService.get<string>(
      'MINIO_RAW_BUCKET',
      'media-raw',
    );
    this.processedBucket = this.configService.get<string>(
      'MINIO_PROCESSED_BUCKET',
      'media-processed',
    );
    this.client = new Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: this.configService.getNumber('MINIO_PORT', 9000),
      useSSL: this.configService.getBoolean('MINIO_USE_SSL', false),
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', 'minio'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY', 'minio123'),
    });
  }

  getRawBucket(): string {
    return this.rawBucket;
  }

  getProcessedBucket(): string {
    return this.processedBucket;
  }

  async createRawUploadUrl(
    objectKey: string,
    expirySeconds = 900,
  ): Promise<string> {
    return this.client.presignedPutObject(
      this.rawBucket,
      objectKey,
      expirySeconds,
    );
  }

  async objectExists(bucket: string, objectKey: string): Promise<boolean> {
    try {
      await this.client.statObject(bucket, objectKey);
      return true;
    } catch {
      return false;
    }
  }

  async getObjectStream(bucket: string, objectKey: string): Promise<Readable> {
    return this.client.getObject(bucket, objectKey);
  }

  async getObjectText(bucket: string, objectKey: string): Promise<string> {
    const stream = await this.getObjectStream(bucket, objectKey);
    const chunks: Buffer[] = [];

    return new Promise<string>((resolve, reject) => {
      stream.on('data', (chunk: Buffer | string) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      stream.on('end', () => {
        resolve(Buffer.concat(chunks).toString('utf8'));
      });
      stream.on('error', reject);
    });
  }
}
