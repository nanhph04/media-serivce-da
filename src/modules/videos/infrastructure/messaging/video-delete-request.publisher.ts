import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import { KAFKA_SERVICE } from '@shared/infrastructure/messaging/kafka.constants';
import { KafkaService } from '@shared/infrastructure/messaging/kafka.service';
import type { IIntegrationEvent } from '@shared/domain/types/events/base-integration.event';
import type { VideoDeleteRequestedEventData } from '../../application/dtos/video-delete-requested.event-data';
import type { IVideoDeleteRequestPublisher } from '../../application/interfaces/video-delete-request-publisher.interface';

@Injectable()
export class VideoDeleteRequestPublisher implements IVideoDeleteRequestPublisher {
  constructor(
    private readonly configService: ConfigService,
    @Inject(KAFKA_SERVICE) private readonly kafkaService: KafkaService,
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

    await this.kafkaService.emit(topic, [
      {
        key: payload.videoId,
        value: event,
      },
    ]);
  }
}
