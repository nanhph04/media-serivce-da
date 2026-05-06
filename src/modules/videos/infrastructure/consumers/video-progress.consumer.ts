import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { IIntegrationEvent } from '@shared/domain/types/events/base-integration.event';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import { KAFKA_SERVICE } from '@shared/infrastructure/messaging/kafka.constants';
import { KafkaService } from '@shared/infrastructure/messaging/kafka.service';
import {
  IDEMPOTENCY_STORE,
  type IIdempotencyStore,
} from '@shared/application/interfaces/cache-store.interface';
import type { VideoProgressUpdatedEventData } from '../../application/dtos/video-progress-updated.event-data';
import { VideoProgressService } from '../../application/services/video-progress.service';

@Injectable()
export class VideoProgressConsumer implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    @Inject(KAFKA_SERVICE) private readonly kafkaService: KafkaService,
    @Inject(IDEMPOTENCY_STORE)
    private readonly idempotencyStore: IIdempotencyStore,
    private readonly videoProgressService: VideoProgressService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.kafkaService.on<IIntegrationEvent<VideoProgressUpdatedEventData>>(
      this.configService.get<string>(
        'KAFKA_VIDEO_PROGRESS_UPDATED_TOPIC',
        'video.progress.updated',
      ),
      async ({ value }) => {
        if (!(await this.markEventProcessed(value.eventId))) {
          return;
        }

        const snapshot = this.mapProgressEvent(value.data);
        await this.videoProgressService.applyProgressUpdate(snapshot);
      },
    );
  }

  private mapProgressEvent(
    data: VideoProgressUpdatedEventData,
  ): ReturnType<VideoProgressService['createSnapshot']> {
    if (data.pipeline === 'moderation') {
      return this.videoProgressService.createSnapshot({
        videoId: data.videoId,
        stage: 'moderating',
        percent: data.percent,
        message: data.errorMessage ?? data.message,
        terminal: false,
      });
    }

    return this.videoProgressService.createSnapshot({
      videoId: data.videoId,
      stage: 'processing',
      percent: data.percent,
      message: data.errorMessage ?? data.message,
      terminal: false,
    });
  }

  private async markEventProcessed(eventId: string): Promise<boolean> {
    return this.idempotencyStore.setIfNotExists(
      `media:event:${eventId}`,
      '1',
      60 * 60 * 24,
    );
  }
}
