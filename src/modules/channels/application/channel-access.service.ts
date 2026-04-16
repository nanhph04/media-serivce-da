import { Inject, Injectable } from '@nestjs/common';
import {
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import { ChannelStatus } from '../domain/entities/channel.entity';
import {
  CHANNEL_REPOSITORY,
  type IChannelRepository,
} from '../domain/repositories/channel.repository';
import {
  CHANNEL_SUBSCRIPTION_REPOSITORY,
  type IChannelSubscriptionRepository,
} from '../domain/repositories/channel-subscription.repository';
import {
  MEMBERSHIP_TIER_REPOSITORY,
  type IMembershipTierRepository,
} from '../domain/repositories/membership-tier.repository';
import type {
  ChannelViewerAccessContext,
  IChannelAccessService,
} from './interfaces/channel-access.service.interface';

@Injectable()
export class ChannelAccessService implements IChannelAccessService {
  constructor(
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
    @Inject(CHANNEL_SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: IChannelSubscriptionRepository,
    @Inject(MEMBERSHIP_TIER_REPOSITORY)
    private readonly membershipTierRepository: IMembershipTierRepository,
  ) {}

  async assertOwnedActiveChannel(
    channelId: string,
    userId: string,
  ): Promise<void> {
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
  }

  async getViewerAccessContext(
    channelId: string,
    userId: string,
  ): Promise<ChannelViewerAccessContext> {
    const channel = await this.channelRepository.findById(channelId);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const subscription =
      await this.subscriptionRepository.findByUserIdAndChannelIdActive(
        userId,
        channelId,
      );

    if (!subscription) {
      return {
        channelOwnerId: channel.userId,
        activeMembershipTierLevel: null,
      };
    }

    const tier = await this.membershipTierRepository.findById(
      subscription.membershipId,
    );

    return {
      channelOwnerId: channel.userId,
      activeMembershipTierLevel: tier?.level ?? null,
    };
  }

  async getActiveSubscribedChannelIds(userId: string): Promise<string[]> {
    const subscriptions =
      await this.subscriptionRepository.findByUserId(userId);

    return subscriptions
      .filter((subscription) => subscription.isCurrentlyActive())
      .map((subscription) => subscription.channelId);
  }
}
