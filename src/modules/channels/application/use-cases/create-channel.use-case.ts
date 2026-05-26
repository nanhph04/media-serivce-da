import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import { ChannelEntity } from '../../domain/entities/channel.entity';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { ConflictException } from '@shared/domain/exceptions/domain.exception';
import type { IIntegrationEvent } from '@shared/domain/types/events/base-integration.event';
import {
  CHANNEL_REPOSITORY,
  type IChannelRepository,
} from '../../domain/repositories/channel.repository';
import type { CreateChannelCommand } from '../dtos/create-channel.command';
import type { ChannelCreatedEventData } from '../dtos/channel-created.event-data';
import type { ChannelResponse } from '../dtos/channel.response';
import {
  CHANNEL_CREATION_TRANSACTION,
  type IChannelCreationTransaction,
} from '../interfaces/channel-creation-transaction.interface';

const CHANNEL_CREATED_TOPIC = 'channel.created';

@Injectable()
export class CreateChannelUseCase extends BaseUseCase<
  CreateChannelCommand,
  ChannelResponse
> {
  constructor(
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
    @Inject(CHANNEL_CREATION_TRANSACTION)
    private readonly channelCreationTransaction: IChannelCreationTransaction,
  ) {
    super();
  }

  async execute(command: CreateChannelCommand): Promise<ChannelResponse> {
    const existingChannel = await this.channelRepository.findByUserId(
      command.userId,
    );
    if (existingChannel) {
      throw new ConflictException(ERROR_MESSAGES.CHANNEL_ALREADY_EXISTS);
    }
    const channel = ChannelEntity.create(command);
    const event: IIntegrationEvent<ChannelCreatedEventData> = {
      eventId: randomUUID(),
      eventType: CHANNEL_CREATED_TOPIC,
      aggregateId: command.userId,
      timestamp: new Date().toISOString(),
      version: 1,
      traceId: command.traceId,
      sourceService: 'media-service',
      data: {
        channelId: channel.id,
        userId: command.userId,
        title: channel.name,
      },
    };

    await this.channelCreationTransaction.createChannelWithOutbox(channel, {
      topic: CHANNEL_CREATED_TOPIC,
      messageKey: command.userId,
      payload: event,
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
}
