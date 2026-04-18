import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { IIntegrationEvent } from '@shared/domain/types/events/base-integration.event';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import { KAFKA_SERVICE } from '@shared/infrastructure/messaging/kafka.constants';
import { KafkaService } from '@shared/infrastructure/messaging/kafka.service';
import { HandleMembershipPaymentSuccessUseCase } from '../../application/use-cases/handle-membership-payment-success.use-case';

@Injectable()
export class MembershipPaymentConsumer implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    @Inject(KAFKA_SERVICE) private readonly kafkaService: KafkaService,
    private readonly handleMembershipPaymentSuccessUseCase: HandleMembershipPaymentSuccessUseCase,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.kafkaService.on<
      IIntegrationEvent<{
        userId: string;
        channelId: string;
        membershipTierId: string;
        expiryDate?: string | null;
      }>
    >(
      this.configService.get<string>(
        'KAFKA_MEMBERSHIP_PAYMENT_SUCCESS_TOPIC',
        'membership.payment.success',
      ),
      async ({ value }) => {
        await this.handleMembershipPaymentSuccessUseCase.execute({
          eventId: value.eventId,
          data: value.data,
        });
      },
    );
  }
}
