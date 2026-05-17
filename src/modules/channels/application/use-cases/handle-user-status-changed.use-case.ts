import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { ChannelStatus } from '../../domain/entities/channel.entity';
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

export interface UserStatusChangedEventData {
  userId: string;
  currentStatus: string;
  changedByAdminId: string;
  reason: string | null;
}

@Injectable()
export class HandleUserStatusChangedUseCase extends BaseUseCase<
  UserStatusChangedEventData,
  void
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

  async execute(input: UserStatusChangedEventData): Promise<void> {
    if (input.currentStatus !== 'suspended') {
      return;
    }

    await this.membershipRepository.disableAutoRenewByUserId(input.userId);

    const channel = await this.channelRepository.findByUserId(input.userId);
    if (!channel || channel.status === ChannelStatus.SUSPENDED) {
      return;
    }

    const previousStatus = channel.status;
    channel.suspend();
    await this.membershipRepository.disableAutoRenewByChannelId(channel.id);
    await this.channelRepository.update(channel);
    await this.channelStatusEventPublisher.publishStatusChanged({
      channelId: channel.id,
      channelOwnerId: channel.userId,
      previousStatus,
      currentStatus: channel.status,
      changedByAdminId: input.changedByAdminId,
      reason: input.reason,
      changedAt: new Date().toISOString(),
    });
  }
}
