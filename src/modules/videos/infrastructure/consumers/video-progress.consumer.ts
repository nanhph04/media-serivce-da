import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { IIntegrationEvent } from '@shared/domain/types/events/base-integration.event';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import { LoggerService } from '@shared/infrastructure/logger/logger.service';
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
    private readonly loggerService: LoggerService,
  ) {}

  async onModuleInit(): Promise<void> {
    const topic = this.configService.get<string>(
      'KAFKA_VIDEO_PROGRESS_UPDATED_TOPIC',
      'video.progress.updated',
    );
    this.loggerService.setContext(VideoProgressConsumer.name);
    this.loggerService.logInfo('Subscribing to video progress topic', {
      topic,
    });

    await this.kafkaService.on<
      IIntegrationEvent<VideoProgressUpdatedEventData>
    >(
      topic,
      async ({ value }) => {
        this.loggerService.setContext(VideoProgressConsumer.name);
        this.loggerService.logInfo('Received video progress event', {
          topic,
          eventId: value.eventId,
          videoId: value.data.videoId,
          pipeline: value.data.pipeline,
          stage: value.data.stage,
          percent: value.data.percent,
          terminal: value.data.terminal,
          message: value.data.message,
        });

        if (!(await this.markEventProcessed(value.eventId))) {
          this.loggerService.logWarn('Skipped duplicate video progress event', {
            eventId: value.eventId,
            videoId: value.data.videoId,
          });
          return;
        }

        const snapshot = this.mapProgressEvent(value.data);
        const accepted =
          await this.videoProgressService.applyProgressUpdate(snapshot);
        this.loggerService.logInfo('Applied video progress event', {
          eventId: value.eventId,
          videoId: value.data.videoId,
          accepted: accepted !== null,
          stage: snapshot.stage,
          percent: snapshot.percent,
          terminal: snapshot.terminal,
        });
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
        terminal: data.terminal,
      });
    }

    return this.videoProgressService.createSnapshot({
      videoId: data.videoId,
      stage: 'processing',
      percent: data.percent,
      message: data.errorMessage ?? data.message,
      terminal: data.terminal,
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
