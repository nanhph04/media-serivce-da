import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { IIntegrationEvent } from '@shared/domain/types/events/base-integration.event';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import { KAFKA_SERVICE } from '@shared/infrastructure/messaging/kafka.constants';
import { KafkaService } from '@shared/infrastructure/messaging/kafka.service';
import type { ChannelStatusChangedEventData } from '../../../channels/application/interfaces/channel-status-event.publisher.interface';
import { HandleChannelStatusChangedUseCase } from '../../application/use-cases/handle-channel-status-changed.use-case';

@Injectable()
export class ChannelStatusChangedConsumer implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    @Inject(KAFKA_SERVICE) private readonly kafkaService: KafkaService,
    private readonly handleChannelStatusChangedUseCase: HandleChannelStatusChangedUseCase,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.kafkaService.on<
      IIntegrationEvent<ChannelStatusChangedEventData>
    >(
      this.configService.get<string>(
        'KAFKA_CHANNEL_STATUS_CHANGED_TOPIC',
        'channel.status.changed',
      ),
      async ({ value }) => {
        await this.handleChannelStatusChangedUseCase.execute(value.data);
      },
    );
  }
}
