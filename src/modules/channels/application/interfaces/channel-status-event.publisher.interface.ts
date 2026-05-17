import type { ChannelStatus } from '../../domain/entities/channel.entity';

export const CHANNEL_STATUS_EVENT_PUBLISHER = Symbol(
  'CHANNEL_STATUS_EVENT_PUBLISHER',
);

export interface ChannelStatusChangedEventData {
  channelId: string;
  channelOwnerId: string;
  previousStatus: ChannelStatus;
  currentStatus: ChannelStatus;
  changedByAdminId: string;
  reason: string | null;
  changedAt: string;
}

export interface IChannelStatusEventPublisher {
  publishStatusChanged(data: ChannelStatusChangedEventData): Promise<void>;
}
