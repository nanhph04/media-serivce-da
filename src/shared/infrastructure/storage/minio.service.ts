import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from 'minio';
import type { Readable } from 'stream';
import { ConfigService } from '../config/config.service';
import { LoggerService } from '../logger/logger.service';
import type {
  IObjectStorageService,
  StorageObjectMetadata,
  StorageBucket,
  UploadObjectInput,
  UploadedPart,
} from '../../application/interfaces/object-storage.service.interface';

interface MinioMultipartClient {
  initiateNewMultipartUpload(
    bucketName: string,
    objectName: string,
    headers: Record<string, string>,
  ): Promise<string>;
  completeMultipartUpload(
    bucketName: string,
    objectName: string,
    uploadId: string,
    etags: { part: number; etag?: string }[],
  ): Promise<{ etag: string; versionId: string | null }>;
  abortMultipartUpload(
    bucketName: string,
    objectName: string,
    uploadId: string,
  ): Promise<void>;
}

@Injectable()
export class MinioService implements OnModuleInit, IObjectStorageService {
  private readonly client: Client;
  private readonly rawBucket: string;
  private readonly processedBucket: string;
  private readonly publicBucket: string;
  private readonly publicEndpoint: string | null;
  private readonly publicPort: number | null;
  private readonly publicUseSSL: boolean | null;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(MinioService.name);
    this.rawBucket = this.configService.getOrThrow<string>('MINIO_RAW_BUCKET');
    this.processedBucket = this.configService.getOrThrow<string>(
      'MINIO_PROCESSED_BUCKET',
    );
    this.publicBucket =
      this.configService.get<string>('MINIO_PUBLIC_BUCKET') ?? 'media-public';
    this.publicEndpoint = this.configService.get<string>(
      'MINIO_PUBLIC_ENDPOINT',
    );
    this.publicPort = this.resolveOptionalNumber('MINIO_PUBLIC_PORT');
    this.publicUseSSL = this.resolveOptionalBoolean('MINIO_PUBLIC_USE_SSL');
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
    await this.ensureBucketExists(this.publicBucket);
    await this.ensureBucketPublicRead(this.publicBucket);
  }

  getRawBucket(): string {
    return this.rawBucket;
  }

  getProcessedBucket(): string {
    return this.processedBucket;
  }

  getBucketName(bucket: StorageBucket): string {
    if (bucket === 'raw') {
      return this.rawBucket;
    }

    if (bucket === 'processed') {
      return this.processedBucket;
    }

    return this.publicBucket;
  }

  async createUploadUrl(
    bucket: StorageBucket,
    objectKey: string,
    expirySeconds = 900,
  ): Promise<string> {
    if (bucket === 'raw') {
      return this.createRawUploadUrl(objectKey, expirySeconds);
    }

    const presignedUrl = await this.client.presignedPutObject(
      this.getBucketName(bucket),
      objectKey,
      expirySeconds,
    );

    return this.rewritePublicUrlIfNeeded(presignedUrl);
  }

  async createReadUrl(
    bucket: StorageBucket,
    objectKey: string,
    expirySeconds = 900,
  ): Promise<string> {
    const presignedUrl = await this.client.presignedGetObject(
      this.getBucketName(bucket),
      objectKey,
      expirySeconds,
    );

    return this.rewritePublicUrlIfNeeded(presignedUrl);
  }

  createObjectUrl(bucket: StorageBucket, objectKey: string): string {
    const useSSL =
      this.publicUseSSL ??
      this.configService.getBooleanOrThrow('MINIO_USE_SSL');
    const protocol = useSSL ? 'https:' : 'http:';
    const hostname =
      this.publicEndpoint ??
      this.configService.getOrThrow<string>('MINIO_ENDPOINT');
    const port =
      this.publicPort ?? this.configService.getNumberOrThrow('MINIO_PORT');
    const url = new URL(`${protocol}//${hostname}`);
    url.port = String(port);
    url.pathname = `${this.getBucketName(bucket)}/${objectKey}`
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/');

    return url.toString();
  }

  async createRawUploadUrl(
    objectKey: string,
    expirySeconds = 900,
  ): Promise<string> {
    const presignedUrl = await this.client.presignedPutObject(
      this.rawBucket,
      objectKey,
      expirySeconds,
    );

    return this.rewritePublicUrlIfNeeded(presignedUrl);
  }

  async createMultipartUpload(
    bucket: StorageBucket,
    objectKey: string,
  ): Promise<string> {
    return this.getMultipartClient().initiateNewMultipartUpload(
      this.getBucketName(bucket),
      objectKey,
      {},
    );
  }

  async createUploadPartUrl(input: {
    bucket: StorageBucket;
    objectKey: string;
    uploadId: string;
    partNumber: number;
    expirySeconds?: number;
  }): Promise<string> {
    const presignedUrl = await this.client.presignedUrl(
      'PUT',
      this.getBucketName(input.bucket),
      input.objectKey,
      input.expirySeconds ?? 900,
      {
        partNumber: String(input.partNumber),
        uploadId: input.uploadId,
      },
    );

    return this.rewritePublicUrlIfNeeded(presignedUrl);
  }

  async completeMultipartUpload(input: {
    bucket: StorageBucket;
    objectKey: string;
    uploadId: string;
    parts: UploadedPart[];
  }): Promise<void> {
    await this.getMultipartClient().completeMultipartUpload(
      this.getBucketName(input.bucket),
      input.objectKey,
      input.uploadId,
      input.parts.map((part) => ({
        part: part.partNumber,
        etag: part.etag,
      })),
    );
  }

  async abortMultipartUpload(input: {
    bucket: StorageBucket;
    objectKey: string;
    uploadId: string;
  }): Promise<void> {
    await this.getMultipartClient().abortMultipartUpload(
      this.getBucketName(input.bucket),
      input.objectKey,
      input.uploadId,
    );
  }

  async uploadObject(input: UploadObjectInput): Promise<string> {
    await this.client.putObject(
      this.getBucketName(input.bucket),
      input.objectKey,
      input.body,
      input.sizeBytes,
      {
        'Content-Type': input.contentType,
      },
    );

    return this.createObjectUrl(input.bucket, input.objectKey);
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

  async copyObject(
    bucket: StorageBucket,
    sourceObjectKey: string,
    destinationObjectKey: string,
  ): Promise<void> {
    const bucketName = this.getBucketName(bucket);
    await this.client.copyObject(
      bucketName,
      destinationObjectKey,
      `/${bucketName}/${sourceObjectKey}`,
    );
  }

  async deleteObject(bucket: StorageBucket, objectKey: string): Promise<void> {
    await this.client.removeObject(this.getBucketName(bucket), objectKey);
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

  private async ensureBucketPublicRead(bucket: string): Promise<void> {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            AWS: ['*'],
          },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucket}/*`],
        },
      ],
    };

    await this.client.setBucketPolicy(bucket, JSON.stringify(policy));
    this.logger.logInfo('Configured public read bucket policy', { bucket });
  }

  private rewritePublicUrlIfNeeded(url: string): string {
    if (!this.publicEndpoint) {
      return url;
    }

    const parsedUrl = new URL(url);
    parsedUrl.hostname = this.publicEndpoint;

    if (this.publicPort !== null) {
      parsedUrl.port = String(this.publicPort);
    }

    if (this.publicUseSSL !== null) {
      parsedUrl.protocol = this.publicUseSSL ? 'https:' : 'http:';
    }

    return parsedUrl.toString();
  }

  private getMultipartClient(): MinioMultipartClient {
    return this.client as unknown as MinioMultipartClient;
  }

  private resolveOptionalNumber(key: string): number | null {
    const value = this.configService.get<string | number>(key);
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value === 'number') {
      return value;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      throw new Error(`Config key "${key}" must be a valid number`);
    }

    return parsed;
  }

  private resolveOptionalBoolean(key: string): boolean | null {
    const value = this.configService.get<string | boolean>(key);
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    throw new Error(`Config key "${key}" must be "true" or "false"`);
  }
}
