import type { Repository } from 'typeorm';
import { KafkaService } from '@shared/infrastructure/messaging/kafka.service';
import { CacheService } from '@shared/infrastructure/cache/cache.service';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import { ChannelEntity } from '../domain/entities/channel.entity';
import { MembershipTierEntity } from '../domain/entities/membership-tier.entity';
import { ChannelRepositoryImpl } from '../infrastructure/persistence/channel.repository.impl';
import { ChannelSubscriptionRepositoryImpl } from '../infrastructure/persistence/channel-subscription.repository.impl';
import { MembershipTierRepositoryImpl } from '../infrastructure/persistence/membership-tier.repository.impl';
import { VideoOrmEntity } from '../../videos/infrastructure/persistence/video.orm-entity';
export declare class ChannelApplicationService {
    private readonly channelRepository;
    private readonly membershipTierRepository;
    private readonly subscriptionRepository;
    private readonly configService;
    private readonly cacheService;
    private readonly kafkaService;
    private readonly videoRepository;
    constructor(channelRepository: ChannelRepositoryImpl, membershipTierRepository: MembershipTierRepositoryImpl, subscriptionRepository: ChannelSubscriptionRepositoryImpl, configService: ConfigService, cacheService: CacheService, kafkaService: KafkaService, videoRepository: Repository<VideoOrmEntity>);
    createChannel(input: {
        userId: string;
        name: string;
        bio: string;
    }): Promise<ChannelEntity>;
    updateChannel(input: {
        channelId: string;
        userId: string;
        name?: string;
        bio?: string;
        avatarUrl?: string;
        bannerUrl?: string;
    }): Promise<ChannelEntity>;
    getChannelDetail(channelId: string): Promise<{
        channel: ChannelEntity;
        membershipTiers: MembershipTierEntity[];
        publicVideos: VideoOrmEntity[];
    }>;
    createTier(input: {
        channelId: string;
        userId: string;
        name: string;
        level: number;
        priceCoin: number;
    }): Promise<MembershipTierEntity>;
    getTiers(channelId: string): Promise<MembershipTierEntity[]>;
    getTier(channelId: string, tierId: string): Promise<MembershipTierEntity>;
    updateTier(input: {
        channelId: string;
        tierId: string;
        userId: string;
        name?: string;
        priceCoin?: number;
        isAcceptingNew?: boolean;
    }): Promise<MembershipTierEntity>;
    disableTier(input: {
        channelId: string;
        tierId: string;
        userId: string;
    }): Promise<MembershipTierEntity>;
    getSubscriptionStatus(input: {
        channelId: string;
        userId: string;
    }): Promise<{
        isActive: boolean;
        membershipId: string | null;
        expiryDate: Date | null;
    }>;
    handleFinanceEvents(): Promise<void>;
    private requireOwnedChannel;
}
