import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { IIntegrationEvent } from '@shared/domain/types/events/base-integration.event';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import { KAFKA_SERVICE } from '@shared/infrastructure/messaging/kafka.constants';
import { KafkaService } from '@shared/infrastructure/messaging/kafka.service';
import { HandleMembershipAutoRenewFailedUseCase } from '../../application/use-cases/handle-membership-auto-renew-failed.use-case';

interface MembershipAutoRenewFailedEventData {
  membershipRecordId: string;
  userId: string;
  channelId: string;
  membershipTierId: string;
  reasonCode: string;
  retryable: boolean;
  idempotencyKey: string;
}

@Injectable()
export class MembershipAutoRenewFailedConsumer implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    @Inject(KAFKA_SERVICE) private readonly kafkaService: KafkaService,
    private readonly handleMembershipAutoRenewFailedUseCase: HandleMembershipAutoRenewFailedUseCase,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.kafkaService.on<
      IIntegrationEvent<MembershipAutoRenewFailedEventData>
    >(
      this.configService.get<string>(
        'KAFKA_MEMBERSHIP_AUTO_RENEW_FAILED_TOPIC',
        'membership.auto_renew.failed',
      ),
      async ({ value }) => {
        await this.handleMembershipAutoRenewFailedUseCase.execute({
          eventId: value.eventId,
          data: value.data,
        });
      },
    );
  }
}
