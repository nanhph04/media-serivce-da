import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import { KAFKA_SERVICE } from '@shared/infrastructure/messaging/kafka.constants';
import { KafkaService } from '@shared/infrastructure/messaging/kafka.service';
import type { IIntegrationEvent } from '@shared/domain/types/events/base-integration.event';
import type { VideoModerationOutcomeEventData } from '../../application/dtos/video-moderation-outcome.event-data';
import type { IVideoModerationOutcomePublisher } from '../../application/interfaces/video-moderation-outcome-publisher.interface';

@Injectable()
export class VideoModerationOutcomePublisher implements IVideoModerationOutcomePublisher {
  constructor(
    private readonly configService: ConfigService,
    @Inject(KAFKA_SERVICE) private readonly kafkaService: KafkaService,
  ) {}

  async publishModerationOutcome(
    payload: VideoModerationOutcomeEventData,
  ): Promise<void> {
    const topic = this.configService.get<string>(
      'KAFKA_VIDEO_MODERATION_OUTCOME_TOPIC',
      'video.moderation.outcome',
    );
    const event: IIntegrationEvent<VideoModerationOutcomeEventData> = {
      eventId: randomUUID(),
      eventType: topic,
      aggregateId: payload.videoId,
      timestamp: new Date().toISOString(),
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
