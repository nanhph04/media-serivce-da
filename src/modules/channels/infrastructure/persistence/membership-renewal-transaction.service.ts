import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import {
  OutboxMessageOrmEntity,
  OutboxMessageStatus,
} from '@shared/infrastructure/messaging/outbox-message.orm-entity';
import type { ChannelMembershipEntity } from '../../domain/entities/channel-membership.entity';
import type {
  IMembershipRenewalTransaction,
  MembershipRenewalOutboxMessage,
} from '../../application/interfaces/membership-renewal-transaction.interface';
import { ChannelMembershipMapper } from '../mappers/channel-membership.mapper';
import { ChannelMembershipOrmEntity } from './channel-membership.orm-entity';

@Injectable()
export class MembershipRenewalTransactionService implements IMembershipRenewalTransaction {
  constructor(
    private readonly dataSource: DataSource,
    private readonly mapper: ChannelMembershipMapper,
  ) {}

  async persistRenewalRequest(
    membership: ChannelMembershipEntity,
    outboxMessage: MembershipRenewalOutboxMessage,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const membershipRepository = manager.getRepository(
        ChannelMembershipOrmEntity,
      );
      const existing = await membershipRepository.findOne({
        where: { id: membership.id },
      });
      if (!existing) {
        throw new Error('Membership not found');
      }

      await membershipRepository.save(this.mapper.toOrm(membership, existing));
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
