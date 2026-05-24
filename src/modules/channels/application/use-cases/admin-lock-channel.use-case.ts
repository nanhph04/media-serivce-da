import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { NotFoundException } from '@shared/domain/exceptions/domain.exception';
import type { IIntegrationEvent } from '@shared/domain/types/events/base-integration.event';
import {
  CHANNEL_REPOSITORY,
  type IChannelRepository,
} from '../../domain/repositories/channel.repository';
import {
  CHANNEL_STATUS_CHANGE_TRANSACTION,
  type IChannelStatusChangeTransaction,
} from '../interfaces/channel-status-change-transaction.interface';
import type { ChannelStatusChangedEventData } from '../interfaces/channel-status-event.publisher.interface';
import type { ChannelResponse } from '../dtos/channel.response';
import type { LockChannelCommand } from '../dtos/lock-channel.command';

const CHANNEL_STATUS_CHANGED_TOPIC = 'channel.status.changed';

@Injectable()
export class AdminLockChannelUseCase extends BaseUseCase<
  LockChannelCommand,
  ChannelResponse
> {
  constructor(
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
    @Inject(CHANNEL_STATUS_CHANGE_TRANSACTION)
    private readonly channelStatusChangeTransaction: IChannelStatusChangeTransaction,
  ) {
    super();
  }

  async execute(command: LockChannelCommand): Promise<ChannelResponse> {
    const channel = await this.channelRepository.findById(command.channelId);

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const previousStatus = channel.status;
    const isLockAction = command.action === 'lock';
    if (command.action === 'lock') {
      channel.suspend();
    } else if (command.action === 'unlock') {
      channel.restore();
    }

    const statusChangedOutboxMessage =
      previousStatus !== channel.status
        ? {
            messageKey: channel.id,
            payload: this.createStatusChangedEvent({
              channelId: channel.id,
              channelOwnerId: channel.userId,
              previousStatus,
              currentStatus: channel.status,
              changedByAdminId: command.adminId,
              reason: command.reason ?? null,
              changedAt: new Date().toISOString(),
            }),
          }
        : undefined;

    await this.channelStatusChangeTransaction.persistStatusChange({
      channel,
      disableAutoRenewByChannelId: isLockAction,
      statusChangedOutboxMessage,
    });

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

  private createStatusChangedEvent(
    data: ChannelStatusChangedEventData,
  ): IIntegrationEvent<ChannelStatusChangedEventData> {
    return {
      eventId: randomUUID(),
      eventType: CHANNEL_STATUS_CHANGED_TOPIC,
      aggregateId: data.channelId,
      timestamp: data.changedAt,
      version: 1,
      traceId: randomUUID(),
      sourceService: 'media-service',
      data,
    };
  }
}
