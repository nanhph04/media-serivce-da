import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { NotFoundException } from '@shared/domain/exceptions/domain.exception';
import {
  CHANNEL_MEMBERSHIP_REPOSITORY,
  type IChannelMembershipRepository,
} from '../../domain/repositories/channel-membership.repository';
import {
  CHANNEL_REPOSITORY,
  type IChannelRepository,
} from '../../domain/repositories/channel.repository';
import {
  CHANNEL_STATUS_EVENT_PUBLISHER,
  type IChannelStatusEventPublisher,
} from '../interfaces/channel-status-event.publisher.interface';
import type { ChannelResponse } from '../dtos/channel.response';
import type { LockChannelCommand } from '../dtos/lock-channel.command';

@Injectable()
export class AdminLockChannelUseCase extends BaseUseCase<
  LockChannelCommand,
  ChannelResponse
> {
  constructor(
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
    @Inject(CHANNEL_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: IChannelMembershipRepository,
    @Inject(CHANNEL_STATUS_EVENT_PUBLISHER)
    private readonly channelStatusEventPublisher: IChannelStatusEventPublisher,
  ) {
    super();
  }

  async execute(command: LockChannelCommand): Promise<ChannelResponse> {
    const channel = await this.channelRepository.findById(command.channelId);

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const previousStatus = channel.status;
    if (command.action === 'lock') {
      channel.suspend();
      await this.membershipRepository.disableAutoRenewByChannelId(channel.id);
    } else if (command.action === 'unlock') {
      channel.restore();
    }

    await this.channelRepository.update(channel);
    if (previousStatus !== channel.status) {
      await this.channelStatusEventPublisher.publishStatusChanged({
        channelId: channel.id,
        channelOwnerId: channel.userId,
        previousStatus,
        currentStatus: channel.status,
        changedByAdminId: command.adminId,
        reason: command.reason ?? null,
        changedAt: new Date().toISOString(),
      });
    }

    return {
      id: channel.id,
      userId: channel.userId,
      name: channel.name,
      bio: channel.bio,
      isEligibleForMembership: channel.isEligibleForMembership,
      isMembershipClosedByAdmin: channel.isMembershipClosedByAdmin,
      membershipReviewStatus: channel.membershipReviewStatus,
      membershipRejectionReason: channel.membershipRejectionReason,
      membershipRequestedAt: channel.membershipRequestedAt,
      membershipReviewedAt: channel.membershipReviewedAt,
      avatarUrl: channel.avatarUrl,
      bannerUrl: channel.bannerUrl,
      status: channel.status,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
    };
  }
}
