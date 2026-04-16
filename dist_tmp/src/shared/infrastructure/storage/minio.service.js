"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinioService = void 0;
const common_1 = require("@nestjs/common");
const minio_1 = require("minio");
const config_service_1 = require("../config/config.service");
let MinioService = class MinioService {
    configService;
    client;
    rawBucket;
    processedBucket;
    constructor(configService) {
        this.configService = configService;
        this.rawBucket = this.configService.get('MINIO_RAW_BUCKET', 'media-raw');
        this.processedBucket = this.configService.get('MINIO_PROCESSED_BUCKET', 'media-processed');
        this.client = new minio_1.Client({
            endPoint: this.configService.get('MINIO_ENDPOINT', 'localhost'),
            port: this.configService.getNumber('MINIO_PORT', 9000),
            useSSL: this.configService.getBoolean('MINIO_USE_SSL', false),
            accessKey: this.configService.get('MINIO_ACCESS_KEY', 'minio'),
            secretKey: this.configService.get('MINIO_SECRET_KEY', 'minio123'),
        });
    }
    getRawBucket() {
        return this.rawBucket;
    }
    getProcessedBucket() {
        return this.processedBucket;
    }
    async createRawUploadUrl(objectKey, expirySeconds = 900) {
        return this.client.presignedPutObject(this.rawBucket, objectKey, expirySeconds);
    }
    async objectExists(bucket, objectKey) {
        try {
            await this.client.statObject(bucket, objectKey);
            return true;
        }
        catch {
            return false;
        }
    }
    async getObjectStream(bucket, objectKey) {
        return this.client.getObject(bucket, objectKey);
    }
    async getObjectText(bucket, objectKey) {
        const stream = await this.getObjectStream(bucket, objectKey);
        const chunks = [];
        return new Promise((resolve, reject) => {
            stream.on('data', (chunk) => {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            });
            stream.on('end', () => {
                resolve(Buffer.concat(chunks).toString('utf8'));
            });
            stream.on('error', reject);
        });
    }
};
exports.MinioService = MinioService;
exports.MinioService = MinioService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_service_1.ConfigService])
], MinioService);
//# sourceMappingURL=minio.service.js.map