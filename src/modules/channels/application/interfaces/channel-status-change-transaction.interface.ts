import type { IIntegrationEvent } from '@shared/domain/types/events/base-integration.event';
import type { ChannelEntity } from '../../domain/entities/channel.entity';
import type { ChannelStatusChangedEventData } from './channel-status-event.publisher.interface';

export const CHANNEL_STATUS_CHANGE_TRANSACTION = Symbol(
  'CHANNEL_STATUS_CHANGE_TRANSACTION',
);

export interface ChannelStatusChangedOutboxMessage {
  messageKey: string;
  payload: IIntegrationEvent<ChannelStatusChangedEventData>;
}

export interface IChannelStatusChangeTransaction {
  persistStatusChange(input: {
    channel: ChannelEntity;
    disableAutoRenewByChannelId: boolean;
    statusChangedOutboxMessage?: ChannelStatusChangedOutboxMessage;
  }): Promise<void>;
}
