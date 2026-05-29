import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import {
  OutboxMessageOrmEntity,
  OutboxMessageStatus,
} from '@shared/infrastructure/messaging/outbox-message.orm-entity';
import type {
  IMembershipCoinCompensationPublisher,
  MembershipCoinCompensationRequest,
} from '../../application/interfaces/membership-coin-compensation.publisher.interface';

@Injectable()
export class MembershipCoinCompensationPublisher implements IMembershipCoinCompensationPublisher {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async publishCompensationRequest(
    request: MembershipCoinCompensationRequest,
  ): Promise<void> {
    const topic = this.configService.get<string>(
      'KAFKA_MEMBERSHIP_COIN_COMPENSATION_TOPIC',
      'membership.coin_compensation_required',
    );

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(OutboxMessageOrmEntity).save({
        id: randomUUID(),
        topic,
        messageKey: request.userId,
        payload: {
          eventId: randomUUID(),
          eventType: 'membership.coin_compensation_required',
          aggregateId: request.channelId,
          timestamp: new Date().toISOString(),
          version: 1,
          traceId: randomUUID(),
          sourceService: 'media-service',
          data: request,
        },
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
