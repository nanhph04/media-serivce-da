import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import type { IIntegrationEvent } from '@shared/domain/types/events/base-integration.event';
import { KAFKA_SERVICE } from '@shared/infrastructure/messaging/kafka.constants';
import { KafkaService } from '@shared/infrastructure/messaging/kafka.service';
import type { VideoProcessedFailedEventData } from '../../application/dtos/video-processed-failed.event-data';
import type { VideoProcessedSuccessEventData } from '../../application/dtos/video-processed-success.event-data';
import { HandleVideoProcessedFailedUseCase } from '../../application/use-cases/handle-video-processed-failed.use-case';
import { HandleVideoProcessedSuccessUseCase } from '../../application/use-cases/handle-video-processed-success.use-case';

@Injectable()
export class VideoProcessingConsumer implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    @Inject(KAFKA_SERVICE) private readonly kafkaService: KafkaService,
    private readonly handleVideoProcessedSuccessUseCase: HandleVideoProcessedSuccessUseCase,
    private readonly handleVideoProcessedFailedUseCase: HandleVideoProcessedFailedUseCase,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.kafkaService.on<
      IIntegrationEvent<VideoProcessedSuccessEventData>
    >(
      this.configService.get<string>(
        'KAFKA_VIDEO_PROCESSED_SUCCESS_TOPIC',
        'video.processed.success',
      ),
      async ({ value }) => {
        await this.handleVideoProcessedSuccessUseCase.execute({
          eventId: value.eventId,
          data: value.data,
        });
      },
    );

    await this.kafkaService.on<
      IIntegrationEvent<VideoProcessedFailedEventData>
    >(
      this.configService.get<string>(
        'KAFKA_VIDEO_PROCESSED_FAILED_TOPIC',
        'video.processed.failed',
      ),
      async ({ value }) => {
        await this.handleVideoProcessedFailedUseCase.execute({
          eventId: value.eventId,
          data: value.data,
        });
      },
    );
  }
}
