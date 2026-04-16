import { ConfigService } from '@shared/infrastructure/config/config.service';
import { PlaybackTokenService } from '@shared/infrastructure/security/playback-token.service';
import { MinioService } from '@shared/infrastructure/storage/minio.service';
import { VideoQueueService } from '@shared/infrastructure/queue/video-queue.service';
import { CacheService } from '@shared/infrastructure/cache/cache.service';
import { KafkaService } from '@shared/infrastructure/messaging/kafka.service';
import { ChannelRepositoryImpl } from '../../channels/infrastructure/persistence/channel.repository.impl';
import { ChannelSubscriptionRepositoryImpl } from '../../channels/infrastructure/persistence/channel-subscription.repository.impl';
import { MembershipTierRepositoryImpl } from '../../channels/infrastructure/persistence/membership-tier.repository.impl';
import { RecordVideoViewUseCase } from '../../engagement/application/use-cases/record-video-view.use-case';
import { VideoEntity, VideoVisibility } from '../domain/entities/video.entity';
import { VideoPurchaseUnlockRepository } from '../infrastructure/persistence/video-purchase-unlock.repository';
import { VideoRepository } from '../infrastructure/persistence/video.repository';
export declare class VideoApplicationService {
    private readonly configService;
    private readonly minioService;
    private readonly videoQueueService;
    private readonly playbackTokenService;
    private readonly videoRepository;
    private readonly unlockRepository;
    private readonly channelRepository;
    private readonly subscriptionRepository;
    private readonly membershipTierRepository;
    private readonly recordVideoViewUseCase;
    private readonly cacheService;
    private readonly kafkaService;
    constructor(configService: ConfigService, minioService: MinioService, videoQueueService: VideoQueueService, playbackTokenService: PlaybackTokenService, videoRepository: VideoRepository, unlockRepository: VideoPurchaseUnlockRepository, channelRepository: ChannelRepositoryImpl, subscriptionRepository: ChannelSubscriptionRepositoryImpl, membershipTierRepository: MembershipTierRepositoryImpl, recordVideoViewUseCase: RecordVideoViewUseCase, cacheService: CacheService, kafkaService: KafkaService);
    initUpload(input: {
        userId: string;
        channelId: string;
        title: string;
        description: string;
        category: string;
        visibility: VideoVisibility;
        price: number;
        requiredTierLevel: number | null;
    }): Promise<{
        videoId: string;
        status: string;
        rawFileKey: string;
        bucket: string;
        uploadUrl: string;
    }>;
    confirmUpload(input: {
        userId: string;
        videoId: string;
        resolutions: string[];
    }): Promise<{
        status: string;
        message: string;
    }>;
    playVideo(input: {
        userId: string;
        videoId: string;
    }): Promise<{
        videoId: string;
        title: string;
        description: string;
        playbackToken: string;
        playbackUrl: string;
    }>;
    unlockVideo(input: {
        userId: string;
        videoId: string;
    }): Promise<void>;
    getLatest(limit: number): Promise<VideoEntity[]>;
    getByCategory(category: string, limit: number): Promise<VideoEntity[]>;
    getSubscribed(userId: string, limit: number): Promise<VideoEntity[]>;
    getPublicByChannel(channelId: string): Promise<VideoEntity[]>;
    handleProcessingEvents(): Promise<void>;
    private assertAccess;
    private markEventProcessed;
}
