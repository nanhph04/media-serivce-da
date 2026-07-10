import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import type { IIntegrationEvent } from '@shared/domain/types/events/base-integration.event';
import { KAFKA_SERVICE } from '@shared/infrastructure/messaging/kafka.constants';
import { KafkaService } from '@shared/infrastructure/messaging/kafka.service';
import type { VideoModerationCompletedEventData } from '../../application/dtos/video-moderation-completed.event-data';
import { HandleVideoModerationCompletedUseCase } from '../../application/use-cases/handle-video-moderation-completed.use-case';

@Injectable()
export class VideoModerationConsumer implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    @Inject(KAFKA_SERVICE) private readonly kafkaService: KafkaService,
    private readonly handleVideoModerationCompletedUseCase: HandleVideoModerationCompletedUseCase,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.kafkaService.on<
      IIntegrationEvent<VideoModerationCompletedEventData>
    >(
      this.configService.get<string>(
        'KAFKA_VIDEO_MODERATION_COMPLETED_TOPIC',
        'video.moderation.completed',
      ),
      async ({ value }) => {
        await this.handleVideoModerationCompletedUseCase.execute({
          eventId: value.eventId,
          traceId: value.traceId,
          data: value.data,
        });
      },
    );
  }
}
