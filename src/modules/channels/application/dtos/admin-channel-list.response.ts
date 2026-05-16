import type { ChannelResponse } from './channel.response';

export type AdminChannelListItemResponse = ChannelResponse;

export interface AdminChannelsPageResponse {
  items: AdminChannelListItemResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
