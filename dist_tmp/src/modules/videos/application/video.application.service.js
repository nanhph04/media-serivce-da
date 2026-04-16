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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoApplicationService = void 0;
const common_1 = require("@nestjs/common");
const config_service_1 = require("@shared/infrastructure/config/config.service");
const playback_token_service_1 = require("@shared/infrastructure/security/playback-token.service");
const minio_service_1 = require("@shared/infrastructure/storage/minio.service");
const video_queue_service_1 = require("@shared/infrastructure/queue/video-queue.service");
const cache_service_1 = require("@shared/infrastructure/cache/cache.service");
const kafka_constants_1 = require("@shared/infrastructure/messaging/kafka.constants");
const kafka_service_1 = require("@shared/infrastructure/messaging/kafka.service");
const domain_exception_1 = require("@shared/domain/exceptions/domain.exception");
const channel_repository_impl_1 = require("../../channels/infrastructure/persistence/channel.repository.impl");
const channel_subscription_repository_impl_1 = require("../../channels/infrastructure/persistence/channel-subscription.repository.impl");
const membership_tier_repository_impl_1 = require("../../channels/infrastructure/persistence/membership-tier.repository.impl");
const record_video_view_use_case_1 = require("../../engagement/application/use-cases/record-video-view.use-case");
const video_entity_1 = require("../domain/entities/video.entity");
const video_purchase_unlock_entity_1 = require("../domain/entities/video-purchase-unlock.entity");
const video_purchase_unlock_repository_1 = require("../infrastructure/persistence/video-purchase-unlock.repository");
const video_repository_1 = require("../infrastructure/persistence/video.repository");
let VideoApplicationService = class VideoApplicationService {
    configService;
    minioService;
    videoQueueService;
    playbackTokenService;
    videoRepository;
    unlockRepository;
    channelRepository;
    subscriptionRepository;
    membershipTierRepository;
    recordVideoViewUseCase;
    cacheService;
    kafkaService;
    constructor(configService, minioService, videoQueueService, playbackTokenService, videoRepository, unlockRepository, channelRepository, subscriptionRepository, membershipTierRepository, recordVideoViewUseCase, cacheService, kafkaService) {
        this.configService = configService;
        this.minioService = minioService;
        this.videoQueueService = videoQueueService;
        this.playbackTokenService = playbackTokenService;
        this.videoRepository = videoRepository;
        this.unlockRepository = unlockRepository;
        this.channelRepository = channelRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.membershipTierRepository = membershipTierRepository;
        this.recordVideoViewUseCase = recordVideoViewUseCase;
        this.cacheService = cacheService;
        this.kafkaService = kafkaService;
    }
    async initUpload(input) {
        const channel = await this.channelRepository.findById(input.channelId);
        if (!channel) {
            throw new domain_exception_1.NotFoundException('Channel not found');
        }
        if (channel.userId !== input.userId) {
            throw new domain_exception_1.ForbiddenException('You do not own this channel');
        }
        const rawFileKey = `uploads/raw/${input.channelId}/${Date.now()}-${crypto.randomUUID()}.mp4`;
        const video = video_entity_1.VideoEntity.create({
            channelId: input.channelId,
            ownerId: input.userId,
            title: input.title,
            description: input.description,
            category: input.category,
            visibility: input.visibility,
            price: input.price,
            requiredTierLevel: input.requiredTierLevel,
            rawFileKey,
        });
        await this.videoRepository.save(video);
        return {
            videoId: video.id,
            status: video.status,
            rawFileKey,
            bucket: this.minioService.getRawBucket(),
            uploadUrl: await this.minioService.createRawUploadUrl(rawFileKey),
        };
    }
    async confirmUpload(input) {
        const video = await this.videoRepository.findById(input.videoId);
        if (!video) {
            throw new domain_exception_1.NotFoundException('Video not found');
        }
        if (video.ownerId !== input.userId) {
            throw new domain_exception_1.ForbiddenException('You do not own this video');
        }
        const exists = await this.minioService.objectExists(this.minioService.getRawBucket(), video.rawFileKey);
        if (!exists) {
            throw new domain_exception_1.NotFoundException('Raw upload file not found');
        }
        video.markProcessing();
        await this.videoRepository.save(video);
        await this.videoQueueService.enqueueTranscodeJob({
            videoId: video.id,
            rawFileKey: video.rawFileKey,
            resolution: input.resolutions,
            userId: input.userId,
        });
        return {
            status: video.status,
            message: 'Video đang được xử lý, bạn sẽ nhận được thông báo khi hoàn tất',
        };
    }
    async playVideo(input) {
        const video = await this.videoRepository.findById(input.videoId);
        if (!video) {
            throw new domain_exception_1.NotFoundException('Video not found');
        }
        await this.assertAccess(video, input.userId);
        const playbackToken = this.playbackTokenService.issueToken({
            videoId: video.id,
            userId: input.userId,
            channelId: video.channelId,
        });
        await this.recordVideoViewUseCase.execute({
            videoId: video.id,
            userId: input.userId,
        });
        return {
            videoId: video.id,
            title: video.title,
            description: video.description,
            playbackToken,
            playbackUrl: `/api/media/stream/${video.id}/master.m3u8?token=${playbackToken}`,
        };
    }
    async unlockVideo(input) {
        if (!(await this.unlockRepository.exists(input.videoId, input.userId))) {
            await this.unlockRepository.save(video_purchase_unlock_entity_1.VideoPurchaseUnlockEntity.create(input));
        }
    }
    async getLatest(limit) {
        return this.videoRepository.findLatestPublic(limit);
    }
    async getByCategory(category, limit) {
        return this.videoRepository.findByCategory(category, limit);
    }
    async getSubscribed(userId, limit) {
        const subscriptions = await this.subscriptionRepository.findByUserId(userId);
        const channelIds = subscriptions
            .filter((subscription) => subscription.isCurrentlyActive())
            .map((subscription) => subscription.channelId);
        return this.videoRepository.findByChannelIds(channelIds, limit);
    }
    async getPublicByChannel(channelId) {
        return this.videoRepository.findPublicByChannelId(channelId);
    }
    async handleProcessingEvents() {
        await this.kafkaService.on(this.configService.get('KAFKA_VIDEO_PROCESSED_SUCCESS_TOPIC', 'video.processed.success'), async ({ value }) => {
            if (!(await this.markEventProcessed(value.eventId))) {
                return;
            }
            const video = await this.videoRepository.findById(value.data.videoId);
            if (!video) {
                return;
            }
            video.markPublic({
                masterPlaylistKey: value.data.masterPlaylistKey,
                durationSeconds: value.data.durationSeconds ?? null,
                thumbnailUrl: value.data.thumbnailUrl ?? null,
                resolutions: value.data.resolution ?? [],
            });
            await this.videoRepository.save(video);
        });
        await this.kafkaService.on(this.configService.get('KAFKA_VIDEO_PROCESSED_FAILED_TOPIC', 'video.processed.failed'), async ({ value }) => {
            if (!(await this.markEventProcessed(value.eventId))) {
                return;
            }
            const video = await this.videoRepository.findById(value.data.videoId);
            if (!video) {
                return;
            }
            video.markFailed(value.data.errorMessage);
            await this.videoRepository.save(video);
        });
    }
    async assertAccess(video, userId) {
        if (video.status !== video_entity_1.VideoStatus.PUBLIC) {
            throw new domain_exception_1.NotFoundException('Video is not public');
        }
        const channel = await this.channelRepository.findById(video.channelId);
        if (!channel) {
            throw new domain_exception_1.NotFoundException('Channel not found');
        }
        if (channel.userId === userId) {
            return;
        }
        if (video.price === 0 && video.requiredTierLevel === null) {
            return;
        }
        const subscription = await this.subscriptionRepository.findByUserIdAndChannelIdActive(userId, video.channelId);
        if (subscription && video.requiredTierLevel !== null) {
            const tier = await this.membershipTierRepository.findById(subscription.membershipId);
            if (tier && tier.level >= video.requiredTierLevel) {
                return;
            }
        }
        if (await this.unlockRepository.exists(video.id, userId)) {
            return;
        }
        throw new domain_exception_1.ForbiddenException('You do not have permission to watch this video');
    }
    async markEventProcessed(eventId) {
        return this.cacheService.setIfNotExists(`media:event:${eventId}`, '1', 60 * 60 * 24);
    }
};
exports.VideoApplicationService = VideoApplicationService;
exports.VideoApplicationService = VideoApplicationService = __decorate([
    (0, common_1.Injectable)(),
    __param(11, (0, common_1.Inject)(kafka_constants_1.KAFKA_SERVICE)),
    __metadata("design:paramtypes", [config_service_1.ConfigService,
        minio_service_1.MinioService,
        video_queue_service_1.VideoQueueService,
        playback_token_service_1.PlaybackTokenService,
        video_repository_1.VideoRepository,
        video_purchase_unlock_repository_1.VideoPurchaseUnlockRepository,
        channel_repository_impl_1.ChannelRepositoryImpl,
        channel_subscription_repository_impl_1.ChannelSubscriptionRepositoryImpl,
        membership_tier_repository_impl_1.MembershipTierRepositoryImpl,
        record_video_view_use_case_1.RecordVideoViewUseCase,
        cache_service_1.CacheService,
        kafka_service_1.KafkaService])
], VideoApplicationService);
//# sourceMappingURL=video.application.service.js.map