import type { Readable } from 'stream';

export const OBJECT_STORAGE_SERVICE = Symbol('OBJECT_STORAGE_SERVICE');

export type StorageBucket = 'raw' | 'processed';

export interface StorageObjectMetadata {
  sizeBytes: number;
}

export interface UploadedPart {
  partNumber: number;
  etag: string;
}

export interface IObjectStorageService {
  getBucketName(bucket: StorageBucket): string;
  createUploadUrl(
    bucket: StorageBucket,
    objectKey: string,
    expirySeconds?: number,
  ): Promise<string>;
  createMultipartUpload(
    bucket: StorageBucket,
    objectKey: string,
  ): Promise<string>;
  createUploadPartUrl(input: {
    bucket: StorageBucket;
    objectKey: string;
    uploadId: string;
    partNumber: number;
    expirySeconds?: number;
  }): Promise<string>;
  completeMultipartUpload(input: {
    bucket: StorageBucket;
    objectKey: string;
    uploadId: string;
    parts: UploadedPart[];
  }): Promise<void>;
  abortMultipartUpload(input: {
    bucket: StorageBucket;
    objectKey: string;
    uploadId: string;
  }): Promise<void>;
  createObjectUrl(bucket: StorageBucket, objectKey: string): string;
  objectExists(bucket: StorageBucket, objectKey: string): Promise<boolean>;
  copyObject(
    bucket: StorageBucket,
    sourceObjectKey: string,
    destinationObjectKey: string,
  ): Promise<void>;
  deleteObject(bucket: StorageBucket, objectKey: string): Promise<void>;
  getObjectMetadata(
    bucket: StorageBucket,
    objectKey: string,
  ): Promise<StorageObjectMetadata>;
  getObjectStream(bucket: StorageBucket, objectKey: string): Promise<Readable>;
  getObjectText(bucket: StorageBucket, objectKey: string): Promise<string>;
}
