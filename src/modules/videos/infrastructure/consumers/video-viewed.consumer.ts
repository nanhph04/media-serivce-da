import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { IIntegrationEvent } from '@shared/domain/types/events/base-integration.event';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import { KAFKA_SERVICE } from '@shared/infrastructure/messaging/kafka.constants';
import { KafkaService } from '@shared/infrastructure/messaging/kafka.service';
import { HandleVideoViewedUseCase } from '../../application/use-cases/handle-video-viewed.use-case';

@Injectable()
export class VideoViewedConsumer implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    @Inject(KAFKA_SERVICE) private readonly kafkaService: KafkaService,
    private readonly handleVideoViewedUseCase: HandleVideoViewedUseCase,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.kafkaService.on<
      IIntegrationEvent<{
        videoId: string;
        userId: string;
      }>
    >(
      this.configService.get<string>('KAFKA_VIDEO_VIEW_TOPIC', 'video.viewed'),
      async ({ value }) => {
        await this.handleVideoViewedUseCase.execute({
          eventId: value.eventId,
          data: value.data,
        });
      },
    );
  }
}
