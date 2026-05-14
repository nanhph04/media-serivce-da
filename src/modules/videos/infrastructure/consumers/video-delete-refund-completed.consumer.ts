import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { IIntegrationEvent } from '@shared/domain/types/events/base-integration.event';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import { KAFKA_SERVICE } from '@shared/infrastructure/messaging/kafka.constants';
import { KafkaService } from '@shared/infrastructure/messaging/kafka.service';
import type { VideoDeleteRefundCompletedEventData } from '../../application/dtos/video-delete-requested.event-data';
import { HandleVideoDeleteRefundCompletedUseCase } from '../../application/use-cases/handle-video-delete-refund-completed.use-case';

@Injectable()
export class VideoDeleteRefundCompletedConsumer implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    @Inject(KAFKA_SERVICE) private readonly kafkaService: KafkaService,
    private readonly handleVideoDeleteRefundCompletedUseCase: HandleVideoDeleteRefundCompletedUseCase,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.kafkaService.on<
      IIntegrationEvent<VideoDeleteRefundCompletedEventData>
    >(
      this.configService.get<string>(
        'KAFKA_VIDEO_DELETE_REFUND_COMPLETED_TOPIC',
        'video.delete.refund.completed',
      ),
      async ({ value }) => {
        await this.handleVideoDeleteRefundCompletedUseCase.execute({
          eventId: value.eventId,
          data: value.data,
        });
      },
    );
  }
}
