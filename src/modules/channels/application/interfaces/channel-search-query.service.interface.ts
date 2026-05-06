import type { ChannelSearchItemResponse } from '../../../search/application/dtos/channel-search-item.response';

export const CHANNEL_SEARCH_QUERY_SERVICE = Symbol(
  'CHANNEL_SEARCH_QUERY_SERVICE',
);

export interface SearchChannelsQuery {
  q: string;
  limit: number;
}

export interface IChannelSearchQueryService {
  searchChannels(
    query: SearchChannelsQuery,
  ): Promise<ChannelSearchItemResponse[]>;
}
