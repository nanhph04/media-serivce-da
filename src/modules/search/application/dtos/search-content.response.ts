import type { VideoListItemResponse } from '../../../videos/application/dtos/video-list-item.response';
import type { ChannelSearchItemResponse } from './channel-search-item.response';

export interface SearchContentResponse {
  videos: VideoListItemResponse[];
  channels: ChannelSearchItemResponse[];
  query: {
    q: string | null;
    category: string | null;
    limit: number;
  };
}
