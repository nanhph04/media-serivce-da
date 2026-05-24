import { Inject, Injectable } from '@nestjs/common';
import {
  EVENT_PUBLISHER,
  type IEventPublisher,
} from '@shared/application/interfaces/event-publisher.interface';
import type { IIntegrationEvent } from '@shared/domain/types/events/base-integration.event';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import type {
  ChannelStatusChangedEventData,
  IChannelStatusEventPublisher,
} from '../../application/interfaces/channel-status-event.publisher.interface';

@Injectable()
export class ChannelStatusEventPublisher implements IChannelStatusEventPublisher {
  constructor(
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: IEventPublisher,
    private readonly configService: ConfigService,
  ) {}

  async publishStatusChanged(
    data: ChannelStatusChangedEventData,
  ): Promise<void> {
    const event: IIntegrationEvent<ChannelStatusChangedEventData> = {
      eventId: crypto.randomUUID(),
      eventType: 'channel.status.changed',
      aggregateId: data.channelId,
      timestamp: data.changedAt,
      version: 1,
      traceId: crypto.randomUUID(),
      sourceService: 'media-service',
      data,
    };

    await this.eventPublisher.emit(
      this.configService.get<string>(
        'KAFKA_CHANNEL_STATUS_CHANGED_TOPIC',
        'channel.status.changed',
      ),
      [{ key: data.channelId, value: event }],
    );
  }
}
