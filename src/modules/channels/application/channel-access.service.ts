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
  CHANNEL_MEMBERSHIP_REPOSITORY,
  type IChannelMembershipRepository,
} from '../domain/repositories/channel-membership.repository';
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
    @Inject(CHANNEL_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: IChannelMembershipRepository,
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

    const membership =
      await this.membershipRepository.findByUserIdAndChannelIdActive(
        userId,
        channelId,
      );

    if (!membership) {
      return {
        channelOwnerId: channel.userId,
        activeMembershipTierLevel: null,
      };
    }

    const tier = await this.membershipTierRepository.findById(
      membership.membershipId,
    );

    return {
      channelOwnerId: channel.userId,
      activeMembershipTierLevel: tier?.level ?? null,
    };
  }

  async getActiveSubscribedChannelIds(userId: string): Promise<string[]> {
    const memberships = await this.membershipRepository.findByUserId(userId);

    return memberships
      .filter((membership) => membership.isCurrentlyActive())
      .map((membership) => membership.channelId);
  }
}
