import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import {
  OutboxMessageOrmEntity,
  OutboxMessageStatus,
} from '@shared/infrastructure/messaging/outbox-message.orm-entity';
import type { IIntegrationEvent } from '@shared/domain/types/events/base-integration.event';
import type { VideoDeleteRequestedEventData } from '../../application/dtos/video-delete-requested.event-data';
import type { IVideoDeleteRequestPublisher } from '../../application/interfaces/video-delete-request-publisher.interface';

@Injectable()
export class VideoDeleteRequestPublisher implements IVideoDeleteRequestPublisher {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async publishVideoDeleteRequested(
    payload: VideoDeleteRequestedEventData,
  ): Promise<void> {
    const topic = this.configService.get<string>(
      'KAFKA_VIDEO_DELETE_REQUESTED_TOPIC',
      'video.delete.requested',
    );
    const event: IIntegrationEvent<VideoDeleteRequestedEventData> = {
      eventId: randomUUID(),
      eventType: 'video.delete.requested',
      aggregateId: payload.videoId,
      timestamp: payload.deletedAt,
      version: 1,
      traceId: randomUUID(),
      sourceService: 'media-service',
      data: payload,
    };

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(OutboxMessageOrmEntity).save({
        id: randomUUID(),
        topic,
        messageKey: payload.videoId,
        payload: event,
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
