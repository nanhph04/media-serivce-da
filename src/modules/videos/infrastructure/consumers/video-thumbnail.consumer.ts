import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import type { IIntegrationEvent } from '@shared/domain/types/events/base-integration.event';
import { KAFKA_SERVICE } from '@shared/infrastructure/messaging/kafka.constants';
import { KafkaService } from '@shared/infrastructure/messaging/kafka.service';
import type { VideoThumbnailFailedEventData } from '../../application/dtos/video-thumbnail-failed.event-data';
import type { VideoThumbnailGeneratedEventData } from '../../application/dtos/video-thumbnail-generated.event-data';
import { HandleVideoThumbnailFailedUseCase } from '../../application/use-cases/handle-video-thumbnail-failed.use-case';
import { HandleVideoThumbnailGeneratedUseCase } from '../../application/use-cases/handle-video-thumbnail-generated.use-case';

@Injectable()
export class VideoThumbnailConsumer implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    @Inject(KAFKA_SERVICE) private readonly kafkaService: KafkaService,
    private readonly handleVideoThumbnailGeneratedUseCase: HandleVideoThumbnailGeneratedUseCase,
    private readonly handleVideoThumbnailFailedUseCase: HandleVideoThumbnailFailedUseCase,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.kafkaService.on<
      IIntegrationEvent<VideoThumbnailGeneratedEventData>
    >(
      this.configService.get<string>(
        'KAFKA_VIDEO_THUMBNAIL_GENERATED_TOPIC',
        'video.thumbnail.generated',
      ),
      async ({ value }) => {
        await this.handleVideoThumbnailGeneratedUseCase.execute({
          eventId: value.eventId,
          data: value.data,
        });
      },
    );

    await this.kafkaService.on<IIntegrationEvent<VideoThumbnailFailedEventData>>(
      this.configService.get<string>(
        'KAFKA_VIDEO_THUMBNAIL_FAILED_TOPIC',
        'video.thumbnail.failed',
      ),
      async ({ value }) => {
        await this.handleVideoThumbnailFailedUseCase.execute({
          eventId: value.eventId,
          data: value.data,
        });
      },
    );
  }
}
