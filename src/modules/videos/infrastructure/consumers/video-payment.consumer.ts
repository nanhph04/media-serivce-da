import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { IIntegrationEvent } from '@shared/domain/types/events/base-integration.event';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import { KAFKA_SERVICE } from '@shared/infrastructure/messaging/kafka.constants';
import { KafkaService } from '@shared/infrastructure/messaging/kafka.service';
import { HandleVideoPaymentSuccessUseCase } from '../../application/use-cases/handle-video-payment-success.use-case';

@Injectable()
export class VideoPaymentConsumer implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    @Inject(KAFKA_SERVICE) private readonly kafkaService: KafkaService,
    private readonly handleVideoPaymentSuccessUseCase: HandleVideoPaymentSuccessUseCase,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.kafkaService.on<
      IIntegrationEvent<{
        userId: string;
        videoId: string;
        channelId: string;
        channelOwnerId: string;
        coinAmount: number;
        paymentTransactionId: string;
      }>
    >(
      this.configService.get<string>(
        'KAFKA_VIDEO_PAYMENT_SUCCESS_TOPIC',
        'video.payment.success',
      ),
      async ({ value }) => {
        await this.handleVideoPaymentSuccessUseCase.execute({
          eventId: value.eventId,
          data: value.data,
        });
      },
    );
  }
}
