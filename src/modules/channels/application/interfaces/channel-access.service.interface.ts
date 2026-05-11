import type { ChannelStatus } from '../../domain/entities/channel.entity';

export const CHANNEL_ACCESS_SERVICE = Symbol('CHANNEL_ACCESS_SERVICE');

export interface ChannelViewerAccessContext {
  channelOwnerId: string;
  channelStatus: ChannelStatus;
  activeMembershipTierLevel: number | null;
}

export interface IChannelAccessService {
  assertOwnedActiveChannel(channelId: string, userId: string): Promise<void>;
  getOwnedActiveChannelId(userId: string): Promise<string>;
  getViewerAccessContext(
    channelId: string,
    userId: string,
  ): Promise<ChannelViewerAccessContext>;
  getActiveMembershipChannelIds(userId: string): Promise<string[]>;
}
