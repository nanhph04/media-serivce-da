import type { VideoListItemResponse } from '../dtos/video-list-item.response';

export const VIDEO_SEARCH_QUERY_SERVICE = Symbol('VIDEO_SEARCH_QUERY_SERVICE');

export interface SearchPublicVideosQuery {
  q?: string;
  category?: string;
  tags?: string[];
  limit: number;
}

export interface IVideoSearchQueryService {
  searchPublicVideos(
    query: SearchPublicVideosQuery,
  ): Promise<VideoListItemResponse[]>;
}
