import { Inject, Injectable } from '@nestjs/common';
import { KAFKA_SERVICE } from '@shared/infrastructure/messaging/kafka.constants';
import { KafkaService } from '@shared/infrastructure/messaging/kafka.service';
import type { IIntegrationEvent } from '@shared/domain/types/events/base-integration.event';
import { CacheService } from '@shared/infrastructure/cache/cache.service';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  ChannelEntity,
  ChannelStatus,
} from '../domain/entities/channel.entity';
import { ChannelMembershipEntity } from '../domain/entities/channel-membership.entity';
import { MembershipTierEntity } from '../domain/entities/membership-tier.entity';
import {
  CHANNEL_REPOSITORY,
  type IChannelRepository,
} from '../domain/repositories/channel.repository';
import {
  CHANNEL_MEMBERSHIP_REPOSITORY,
  type IChannelMembershipRepository,
} from '../domain/repositories/channel-membership.repository';
import {
  MEMBERSHIP_TIER_REPOSITORY,
  type IMembershipTierRepository,
} from '../domain/repositories/membership-tier.repository';
import {
  MEMBERSHIP_CONFIG,
  type IMembershipConfig,
} from '@shared/application/interfaces/membership-config.interface';
import type { ChannelDetailResponse } from './dtos/channel-detail.response';
import {
  VIDEO_QUERY_SERVICE,
  type IVideoQueryService,
} from '../../videos/application/interfaces/video-query.service.interface';

interface MembershipPaymentSuccessData {
  userId: string;
  channelId: string;
  membershipTierId: string;
  expiryDate?: string | null;
}

@Injectable()
export class ChannelApplicationService {
  constructor(
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
    @Inject(MEMBERSHIP_TIER_REPOSITORY)
    private readonly membershipTierRepository: IMembershipTierRepository,
    @Inject(CHANNEL_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: IChannelMembershipRepository,
    @Inject(MEMBERSHIP_CONFIG)
    private readonly membershipConfig: IMembershipConfig,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    @Inject(KAFKA_SERVICE) private readonly kafkaService: KafkaService,
    @Inject(VIDEO_QUERY_SERVICE)
    private readonly videoQueryService: IVideoQueryService,
  ) {}

  async createChannel(input: {
    userId: string;
    name: string;
    bio: string;
  }): Promise<ChannelEntity> {
    const existing = await this.channelRepository.findByUserId(input.userId);
    if (existing) {
      throw new BadRequestException('Channel already exists');
    }

    const channel = ChannelEntity.create(input);
    await this.channelRepository.create(channel);
    return channel;
  }

  async updateChannel(input: {
    channelId: string;
    userId: string;
    name?: string;
    bio?: string;
    avatarUrl?: string;
    bannerUrl?: string;
  }): Promise<ChannelEntity> {
    const channel = await this.requireOwnedChannel(
      input.channelId,
      input.userId,
    );
    channel.update({
      name: input.name,
      bio: input.bio,
      avatarUrl: input.avatarUrl,
      bannerUrl: input.bannerUrl,
    });
    await this.channelRepository.update(channel);
    return channel;
  }

  async getChannelDetail(channelId: string): Promise<ChannelDetailResponse> {
    const channel = await this.channelRepository.findById(channelId);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const membershipTiers = (
      await this.membershipTierRepository.findByChannelId(channelId)
    ).filter((tier) => tier.isAcceptingNew);

    const publicVideos =
      await this.videoQueryService.getPublicVideoSummariesByChannel(channelId);

    return {
      channel: {
        id: channel.id,
        userId: channel.userId,
        name: channel.name,
        bio: channel.bio,
        isEligibleForMembership: channel.isEligibleForMembership,
        avatarUrl: channel.avatarUrl,
        bannerUrl: channel.bannerUrl,
        status: channel.status,
        createdAt: channel.createdAt,
        updatedAt: channel.updatedAt,
      },
      membershipTiers: membershipTiers.map((tier) => ({
        id: tier.id,
        channelId: tier.channelId,
        name: tier.name,
        level: tier.level,
        priceCoin: tier.priceCoin,
        isAcceptingNew: tier.isAcceptingNew,
        createdAt: tier.createdAt,
        updatedAt: tier.updatedAt,
      })),
      publicVideos,
    };
  }

  async createTier(input: {
    channelId: string;
    userId: string;
    name: string;
    level: number;
    priceCoin: number;
  }): Promise<MembershipTierEntity> {
    await this.requireOwnedChannel(input.channelId, input.userId);

    const existingTiers = await this.membershipTierRepository.findByChannelId(
      input.channelId,
    );
    const duplicate = existingTiers.find((tier) => tier.level === input.level);
    if (duplicate) {
      throw new ConflictException('Membership tier level already exists');
    }

    const minPrice = this.membershipConfig.getMinPriceForLevel(input.level);
    if (input.priceCoin < minPrice) {
      throw new BadRequestException(
        `Price must be at least ${minPrice} coin for level ${input.level}`,
      );
    }

    const tier = MembershipTierEntity.create(input);
    await this.membershipTierRepository.create(tier);
    return tier;
  }

  async getTiers(channelId: string): Promise<MembershipTierEntity[]> {
    return this.membershipTierRepository.findByChannelId(channelId);
  }

  async getTier(
    channelId: string,
    tierId: string,
  ): Promise<MembershipTierEntity> {
    const tier = await this.membershipTierRepository.findById(tierId);
    if (!tier || tier.channelId !== channelId) {
      throw new NotFoundException('Membership tier not found');
    }
    return tier;
  }

  async updateTier(input: {
    channelId: string;
    tierId: string;
    userId: string;
    name?: string;
    priceCoin?: number;
    isAcceptingNew?: boolean;
  }): Promise<MembershipTierEntity> {
    await this.requireOwnedChannel(input.channelId, input.userId);
    const tier = await this.getTier(input.channelId, input.tierId);

    if (input.priceCoin !== undefined) {
      const minPrice = this.membershipConfig.getMinPriceForLevel(tier.level);
      if (input.priceCoin < minPrice) {
        throw new BadRequestException(
          `Price must be at least ${minPrice} coin for level ${tier.level}`,
        );
      }
    }

    tier.update({
      name: input.name,
      priceCoin: input.priceCoin,
      isAcceptingNew: input.isAcceptingNew,
    });
    await this.membershipTierRepository.update(tier);
    return tier;
  }

  async disableTier(input: {
    channelId: string;
    tierId: string;
    userId: string;
  }): Promise<MembershipTierEntity> {
    await this.requireOwnedChannel(input.channelId, input.userId);
    const tier = await this.getTier(input.channelId, input.tierId);
    tier.hide();
    await this.membershipTierRepository.update(tier);
    return tier;
  }

  async getMembershipStatus(input: {
    channelId: string;
    userId: string;
  }): Promise<{
    isActive: boolean;
    membershipId: string | null;
    expiryDate: Date | null;
  }> {
    const membership =
      await this.membershipRepository.findByUserIdAndChannelIdActive(
        input.userId,
        input.channelId,
      );

    return {
      isActive: membership?.isCurrentlyActive() ?? false,
      membershipId: membership?.membershipId ?? null,
      expiryDate: membership?.expiryDate ?? null,
    };
  }

  async handleFinanceEvents(): Promise<void> {
    await this.kafkaService.on<IIntegrationEvent<MembershipPaymentSuccessData>>(
      this.configService.get<string>(
        'KAFKA_MEMBERSHIP_PAYMENT_SUCCESS_TOPIC',
        'membership.payment.success',
      ),
      async ({ value }) => {
        if (
          !(await this.cacheService.setIfNotExists(
            `media:event:${value.eventId}`,
            '1',
            60 * 60 * 24,
          ))
        ) {
          return;
        }

        const existing =
          await this.membershipRepository.findByUserIdAndChannelId(
            value.data.userId,
            value.data.channelId,
          );

        if (existing) {
          existing.syncMembership({
            membershipId: value.data.membershipTierId,
            expiryDate: value.data.expiryDate
              ? new Date(value.data.expiryDate)
              : null,
          });
          await this.membershipRepository.upsert(existing);
          return;
        }

        const membership = ChannelMembershipEntity.create({
          userId: value.data.userId,
          channelId: value.data.channelId,
          membershipId: value.data.membershipTierId,
          expiryDate: value.data.expiryDate
            ? new Date(value.data.expiryDate)
            : null,
        });
        await this.membershipRepository.upsert(membership);
      },
    );
  }

  private async requireOwnedChannel(
    channelId: string,
    userId: string,
  ): Promise<ChannelEntity> {
    const channel = await this.channelRepository.findById(channelId);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    if (channel.userId !== userId) {
      throw new ForbiddenException('You do not own this channel');
    }
    if (channel.status !== ChannelStatus.ACTIVE) {
      throw new ForbiddenException('Channel is not active');
    }
    return channel;
  }
}
