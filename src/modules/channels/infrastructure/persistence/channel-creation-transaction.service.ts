import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import {
  OutboxMessageOrmEntity,
  OutboxMessageStatus,
} from '@shared/infrastructure/messaging/outbox-message.orm-entity';
import type { ChannelEntity } from '../../domain/entities/channel.entity';
import { ChannelOrmEntity } from './channel.orm-entity';
import type {
  ChannelCreatedOutboxMessage,
  IChannelCreationTransaction,
} from '../../application/interfaces/channel-creation-transaction.interface';

@Injectable()
export class ChannelCreationTransactionService implements IChannelCreationTransaction {
  constructor(private readonly dataSource: DataSource) {}

  async createChannelWithOutbox(
    channel: ChannelEntity,
    outboxMessage: ChannelCreatedOutboxMessage,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(ChannelOrmEntity).save({
        id: channel.id,
        userId: channel.userId,
        name: channel.name,
        bio: channel.bio,
        avatarUrl: channel.avatarUrl,
        bannerUrl: channel.bannerUrl,
        avatarObjectKey: channel.avatarObjectKey,
        bannerObjectKey: channel.bannerObjectKey,
        status: channel.status,
        isEligibleForMembership: channel.isEligibleForMembership,
        isMembershipClosedByAdmin: channel.isMembershipClosedByAdmin,
        createdAt: channel.createdAt,
        updatedAt: channel.updatedAt,
      });

      await manager.getRepository(OutboxMessageOrmEntity).save({
        id: randomUUID(),
        topic: outboxMessage.topic,
        messageKey: outboxMessage.messageKey,
        payload: outboxMessage.payload,
        status: OutboxMessageStatus.PENDING,
        attemptCount: 0,
        nextAttemptAt: new Date(),
        lockedAt: null,
        publishedAt: null,
        lastError: null,
      });
    });
  }
}
