import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { IIntegrationEvent } from '@shared/domain/types/events/base-integration.event';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import { KAFKA_SERVICE } from '@shared/infrastructure/messaging/kafka.constants';
import { KafkaService } from '@shared/infrastructure/messaging/kafka.service';
import {
  HandleUserStatusChangedUseCase,
  type UserStatusChangedEventData,
} from '../../application/use-cases/handle-user-status-changed.use-case';

@Injectable()
export class UserStatusChangedConsumer implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    @Inject(KAFKA_SERVICE) private readonly kafkaService: KafkaService,
    private readonly handleUserStatusChangedUseCase: HandleUserStatusChangedUseCase,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.kafkaService.on<IIntegrationEvent<UserStatusChangedEventData>>(
      this.configService.get<string>(
        'KAFKA_USER_STATUS_CHANGED_TOPIC',
        'user.status.changed',
      ),
      async ({ value }) => {
        await this.handleUserStatusChangedUseCase.execute(value.data);
      },
    );
  }
}
