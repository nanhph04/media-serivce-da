import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import {
  OutboxMessageOrmEntity,
  OutboxMessageStatus,
} from '@shared/infrastructure/messaging/outbox-message.orm-entity';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import {
  ChannelMembershipRenewalStatus,
  ChannelMembershipStatus,
} from '../../domain/entities/channel-membership.entity';
import type {
  ChannelStatusChangedOutboxMessage,
  IChannelStatusChangeTransaction,
} from '../../application/interfaces/channel-status-change-transaction.interface';
import type { ChannelEntity } from '../../domain/entities/channel.entity';
import { ChannelMembershipOrmEntity } from './channel-membership.orm-entity';
import { ChannelOrmEntity } from './channel.orm-entity';

@Injectable()
export class ChannelStatusChangeTransactionService implements IChannelStatusChangeTransaction {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async persistStatusChange(input: {
    channel: ChannelEntity;
    disableAutoRenewByChannelId: boolean;
    statusChangedOutboxMessage?: ChannelStatusChangedOutboxMessage;
  }): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(ChannelOrmEntity).save({
        id: input.channel.id,
        userId: input.channel.userId,
        name: input.channel.name,
        bio: input.channel.bio,
        avatarUrl: input.channel.avatarUrl,
        bannerUrl: input.channel.bannerUrl,
        avatarObjectKey: input.channel.avatarObjectKey,
        bannerObjectKey: input.channel.bannerObjectKey,
        status: input.channel.status,
        isEligibleForMembership: input.channel.isEligibleForMembership,
        isMembershipClosedByAdmin: input.channel.isMembershipClosedByAdmin,
        membershipReviewStatus: input.channel.membershipReviewStatus,
        membershipRejectionReason: input.channel.membershipRejectionReason,
        membershipReviewedBy: input.channel.membershipReviewedBy,
        membershipReviewedAt: input.channel.membershipReviewedAt,
        membershipRequestedAt: input.channel.membershipRequestedAt,
        createdAt: input.channel.createdAt,
        updatedAt: input.channel.updatedAt,
      });

      if (input.disableAutoRenewByChannelId) {
        await manager.getRepository(ChannelMembershipOrmEntity).update(
          {
            channelId: input.channel.id,
            status: ChannelMembershipStatus.ACTIVE,
            autoRenewEnabled: true,
          },
          {
            autoRenewEnabled: false,
            renewalStatus: ChannelMembershipRenewalStatus.DISABLED,
            nextRenewalAttemptAt: null,
            updatedAt: new Date(),
          },
        );
      }

      if (input.statusChangedOutboxMessage) {
        await manager.getRepository(OutboxMessageOrmEntity).save({
          id: randomUUID(),
          topic: this.configService.get<string>(
            'KAFKA_CHANNEL_STATUS_CHANGED_TOPIC',
            'channel.status.changed',
          ),
          messageKey: input.statusChangedOutboxMessage.messageKey,
          payload: input.statusChangedOutboxMessage.payload,
          status: OutboxMessageStatus.PENDING,
          attemptCount: 0,
          nextAttemptAt: new Date(),
          lockedAt: null,
          publishedAt: null,
          lastError: null,
        });
      }
    });
  }
}
