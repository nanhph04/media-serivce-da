import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  EVENT_PUBLISHER,
  type IEventPublisher,
} from '../../application/interfaces/event-publisher.interface';
import { ConfigService } from '../config/config.service';
import { LoggerService } from '../logger/logger.service';
import { OutboxMessageStatus } from './outbox-message.orm-entity';

interface ClaimedOutboxMessage {
  id: string;
  topic: string;
  messageKey: string;
  payload: unknown;
  attemptCount: number;
}

@Injectable()
export class OutboxPublisherWorker
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    private readonly dataSource: DataSource,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: IEventPublisher,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  onApplicationBootstrap(): void {
    const intervalMs = this.configService.getNumber(
      'OUTBOX_PUBLISH_INTERVAL_MS',
      5000,
    );

    this.timer = setInterval(() => {
      void this.publishPendingBatch();
    }, intervalMs);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async publishPendingBatch(): Promise<number> {
    if (this.isRunning || !this.isKafkaEnabled()) {
      return 0;
    }

    this.isRunning = true;

    try {
      const messages = await this.claimPendingMessages();

      for (const message of messages) {
        await this.publishMessage(message);
      }

      return messages.length;
    } finally {
      this.isRunning = false;
    }
  }

  private async claimPendingMessages(): Promise<ClaimedOutboxMessage[]> {
    const batchSize = this.configService.getNumber('OUTBOX_BATCH_SIZE', 20);
    const lockTimeoutSeconds = this.configService.getNumber(
      'OUTBOX_LOCK_TIMEOUT_SECONDS',
      60,
    );

    return this.dataSource.query<ClaimedOutboxMessage[]>(
      `
        UPDATE "outbox_messages"
        SET
          "status" = $1,
          "locked_at" = NOW(),
          "updated_at" = NOW()
        WHERE "id" IN (
          SELECT "id"
          FROM "outbox_messages"
          WHERE (
            "status" = $2
            AND "next_attempt_at" <= NOW()
          )
          OR (
            "status" = $1
            AND "locked_at" < NOW() - ($4 * INTERVAL '1 second')
          )
          ORDER BY "created_at" ASC
          LIMIT $3
          FOR UPDATE SKIP LOCKED
        )
        RETURNING
          "id",
          "topic",
          "message_key" AS "messageKey",
          "payload",
          "attempt_count" AS "attemptCount"
      `,
      [
        OutboxMessageStatus.PROCESSING,
        OutboxMessageStatus.PENDING,
        batchSize,
        lockTimeoutSeconds,
      ],
    );
  }

  private async publishMessage(message: ClaimedOutboxMessage): Promise<void> {
    try {
      await this.eventPublisher.emit(message.topic, [
        {
          key: message.messageKey,
          value: message.payload,
        },
      ]);

      await this.markPublished(message.id);
    } catch (error: unknown) {
      await this.markFailed(message, error);
      this.logger.setContext(OutboxPublisherWorker.name);
      this.logger.logError('Outbox message publish failed', error, {
        outboxMessageId: message.id,
        topic: message.topic,
      });
    }
  }

  private async markPublished(id: string): Promise<void> {
    await this.dataSource.query(
      `
        UPDATE "outbox_messages"
        SET
          "status" = $1,
          "published_at" = NOW(),
          "locked_at" = NULL,
          "updated_at" = NOW()
        WHERE "id" = $2
      `,
      [OutboxMessageStatus.PUBLISHED, id],
    );
  }

  private async markFailed(
    message: ClaimedOutboxMessage,
    error: unknown,
  ): Promise<void> {
    const nextAttemptAt = new Date(
      Date.now() + this.getBackoffMs(message.attemptCount),
    );
    const lastError = this.getErrorMessage(error).slice(0, 4000);

    await this.dataSource.query(
      `
        UPDATE "outbox_messages"
        SET
          "status" = $1,
          "attempt_count" = "attempt_count" + 1,
          "next_attempt_at" = $2,
          "locked_at" = NULL,
          "last_error" = $3,
          "updated_at" = NOW()
        WHERE "id" = $4
      `,
      [OutboxMessageStatus.PENDING, nextAttemptAt, lastError, message.id],
    );
  }

  private getBackoffMs(attemptCount: number): number {
    const maxBackoffSeconds = this.configService.getNumber(
      'OUTBOX_MAX_BACKOFF_SECONDS',
      300,
    );
    const backoffSeconds = Math.min(
      maxBackoffSeconds,
      2 ** Math.min(attemptCount, 8),
    );

    return backoffSeconds * 1000;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown outbox error';
  }

  private isKafkaEnabled(): boolean {
    return this.configService.get<string>('KAFKA_ENABLE') === 'true';
  }
}
