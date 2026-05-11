import type { IIntegrationEvent } from '@shared/domain/types/events/base-integration.event';
import type { ChannelEntity } from '../../domain/entities/channel.entity';
import type { ChannelCreatedEventData } from '../dtos/channel-created.event-data';

export const CHANNEL_CREATION_TRANSACTION = Symbol(
  'CHANNEL_CREATION_TRANSACTION',
);

export interface ChannelCreatedOutboxMessage {
  topic: string;
  messageKey: string;
  payload: IIntegrationEvent<ChannelCreatedEventData>;
}

export interface IChannelCreationTransaction {
  createChannelWithOutbox(
    channel: ChannelEntity,
    outboxMessage: ChannelCreatedOutboxMessage,
  ): Promise<void>;
}
