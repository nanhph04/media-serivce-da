import type { Readable } from 'stream';

export const OBJECT_STORAGE_SERVICE = Symbol('OBJECT_STORAGE_SERVICE');

export type StorageBucket = 'raw' | 'processed';

export interface StorageObjectMetadata {
  sizeBytes: number;
}

export interface IObjectStorageService {
  getBucketName(bucket: StorageBucket): string;
  createUploadUrl(
    bucket: StorageBucket,
    objectKey: string,
    expirySeconds?: number,
  ): Promise<string>;
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
