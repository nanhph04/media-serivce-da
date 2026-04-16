import type { Readable } from 'stream';
import { ConfigService } from '../config/config.service';
export declare class MinioService {
    private readonly configService;
    private readonly client;
    private readonly rawBucket;
    private readonly processedBucket;
    constructor(configService: ConfigService);
    getRawBucket(): string;
    getProcessedBucket(): string;
    createRawUploadUrl(objectKey: string, expirySeconds?: number): Promise<string>;
    objectExists(bucket: string, objectKey: string): Promise<boolean>;
    getObjectStream(bucket: string, objectKey: string): Promise<Readable>;
    getObjectText(bucket: string, objectKey: string): Promise<string>;
}
