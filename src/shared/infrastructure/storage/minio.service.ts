import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from 'minio';
import type { Readable } from 'stream';
import { ConfigService } from '../config/config.service';
import { LoggerService } from '../logger/logger.service';
import type {
  IObjectStorageService,
  StorageObjectMetadata,
  StorageBucket,
} from '../../application/interfaces/object-storage.service.interface';

@Injectable()
export class MinioService implements OnModuleInit, IObjectStorageService {
  private readonly client: Client;
  private readonly rawBucket: string;
  private readonly processedBucket: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(MinioService.name);
    this.rawBucket = this.configService.getOrThrow<string>('MINIO_RAW_BUCKET');
    this.processedBucket = this.configService.getOrThrow<string>(
      'MINIO_PROCESSED_BUCKET',
    );
    this.client = new Client({
      endPoint: this.configService.getOrThrow<string>('MINIO_ENDPOINT'),
      port: this.configService.getNumberOrThrow('MINIO_PORT'),
      useSSL: this.configService.getBooleanOrThrow('MINIO_USE_SSL'),
      accessKey: this.configService.getOrThrow<string>('MINIO_ACCESS_KEY'),
      secretKey: this.configService.getOrThrow<string>('MINIO_SECRET_KEY'),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.ensureBucketExists(this.rawBucket);
    await this.ensureBucketExists(this.processedBucket);
  }

  getRawBucket(): string {
    return this.rawBucket;
  }

  getProcessedBucket(): string {
    return this.processedBucket;
  }

  getBucketName(bucket: StorageBucket): string {
    return bucket === 'raw' ? this.rawBucket : this.processedBucket;
  }

  async createUploadUrl(
    bucket: StorageBucket,
    objectKey: string,
    expirySeconds = 900,
  ): Promise<string> {
    return bucket === 'raw'
      ? this.createRawUploadUrl(objectKey, expirySeconds)
      : this.client.presignedPutObject(
          this.processedBucket,
          objectKey,
          expirySeconds,
        );
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

  async objectExists(
    bucket: StorageBucket,
    objectKey: string,
  ): Promise<boolean> {
    try {
      await this.client.statObject(this.getBucketName(bucket), objectKey);
      return true;
    } catch {
      return false;
    }
  }

  async getObjectMetadata(
    bucket: StorageBucket,
    objectKey: string,
  ): Promise<StorageObjectMetadata> {
    const stat = await this.client.statObject(
      this.getBucketName(bucket),
      objectKey,
    );

    return {
      sizeBytes: stat.size,
    };
  }

  async getObjectStream(
    bucket: StorageBucket,
    objectKey: string,
  ): Promise<Readable> {
    return this.client.getObject(this.getBucketName(bucket), objectKey);
  }

  async getObjectText(
    bucket: StorageBucket,
    objectKey: string,
  ): Promise<string> {
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

  private async ensureBucketExists(bucket: string): Promise<void> {
    const exists = await this.client.bucketExists(bucket);

    if (exists) {
      return;
    }

    await this.client.makeBucket(bucket);
    this.logger.logInfo('Created MinIO bucket', { bucket });
  }
}
