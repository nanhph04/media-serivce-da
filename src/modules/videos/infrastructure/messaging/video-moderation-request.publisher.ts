import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import { KAFKA_SERVICE } from '@shared/infrastructure/messaging/kafka.constants';
import { KafkaService } from '@shared/infrastructure/messaging/kafka.service';
import type { IIntegrationEvent } from '@shared/domain/types/events/base-integration.event';
import type {
  IVideoModerationRequestPublisher,
  VideoModerationRequestPayload,
} from '../../application/interfaces/video-moderation-request-publisher.interface';

interface VideoModerationRequestedEventData {
  videoId: string;
  rawFileKey: string;
  rawBucket: string;
  resolutions: string[];
  userId: string;
}

@Injectable()
export class VideoModerationRequestPublisher
  implements IVideoModerationRequestPublisher
{
  constructor(
    private readonly configService: ConfigService,
    @Inject(KAFKA_SERVICE) private readonly kafkaService: KafkaService,
  ) {}

  async publishModerationRequested(
    payload: VideoModerationRequestPayload,
  ): Promise<void> {
    const topic = this.configService.get<string>(
      'KAFKA_VIDEO_MODERATION_REQUESTED_TOPIC',
      'video.moderation.requested',
    );
    const event: IIntegrationEvent<VideoModerationRequestedEventData> = {
      eventId: randomUUID(),
      eventType: topic,
      aggregateId: payload.videoId,
      timestamp: new Date().toISOString(),
      version: 1,
      traceId: randomUUID(),
      sourceService: 'media-service',
      data: {
        videoId: payload.videoId,
        rawFileKey: payload.rawFileKey,
        rawBucket: payload.rawBucket,
        resolutions: payload.resolution,
        userId: payload.userId,
      },
    };

    await this.kafkaService.emit(topic, [
      {
        key: payload.videoId,
        value: event,
      },
    ]);
  }
}
