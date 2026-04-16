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
exports.StreamingApplicationService = void 0;
const common_1 = require("@nestjs/common");
const playback_token_service_1 = require("@shared/infrastructure/security/playback-token.service");
const minio_service_1 = require("@shared/infrastructure/storage/minio.service");
const domain_exception_1 = require("@shared/domain/exceptions/domain.exception");
const video_repository_1 = require("../../videos/infrastructure/persistence/video.repository");
let StreamingApplicationService = class StreamingApplicationService {
    playbackTokenService;
    minioService;
    videoRepository;
    constructor(playbackTokenService, minioService, videoRepository) {
        this.playbackTokenService = playbackTokenService;
        this.minioService = minioService;
        this.videoRepository = videoRepository;
    }
    async streamMasterPlaylist(videoId, token) {
        this.playbackTokenService.verifyToken(token, videoId);
        const video = await this.videoRepository.findById(videoId);
        if (!video || !video.masterPlaylistKey) {
            throw new domain_exception_1.NotFoundException('Video master playlist not found');
        }
        const playlist = await this.minioService.getObjectText(this.minioService.getProcessedBucket(), video.masterPlaylistKey);
        return this.rewritePlaylist(videoId, token, playlist);
    }
    async pipeSegment(input, response) {
        this.playbackTokenService.verifyToken(input.token, input.videoId);
        const video = await this.videoRepository.findById(input.videoId);
        if (!video || !video.masterPlaylistKey) {
            throw new domain_exception_1.NotFoundException('Video master playlist not found');
        }
        const playlistDir = this.getPlaylistDirectory(video.masterPlaylistKey);
        const objectKey = `${playlistDir}/${input.segmentName}`.replace(/\\/g, '/');
        const stream = await this.minioService.getObjectStream(this.minioService.getProcessedBucket(), objectKey);
        const contentType = input.segmentName.endsWith('.m3u8')
            ? 'application/vnd.apple.mpegurl'
            : 'video/mp2t';
        response.setHeader('Content-Type', contentType);
        await new Promise((resolve, reject) => {
            stream.on('error', reject);
            response.on('close', resolve);
            stream.pipe(response);
        });
    }
    rewritePlaylist(videoId, token, playlist) {
        return playlist
            .split('\n')
            .map((line) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) {
                return line;
            }
            if (trimmed.includes('://')) {
                throw new domain_exception_1.ForbiddenException('External playlist URLs are not allowed');
            }
            return `/api/media/stream/${videoId}/segments/${encodeURIComponent(trimmed)}?token=${token}`;
        })
            .join('\n');
    }
    getPlaylistDirectory(masterPlaylistKey) {
        const lastSlashIndex = masterPlaylistKey.lastIndexOf('/');
        if (lastSlashIndex < 0) {
            return '';
        }
        return masterPlaylistKey.slice(0, lastSlashIndex);
    }
};
exports.StreamingApplicationService = StreamingApplicationService;
exports.StreamingApplicationService = StreamingApplicationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [playback_token_service_1.PlaybackTokenService,
        minio_service_1.MinioService,
        video_repository_1.VideoRepository])
], StreamingApplicationService);
//# sourceMappingURL=streaming.application.service.js.map