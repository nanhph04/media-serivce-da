import type { VideoListItemResponse } from '../dtos/video-list-item.response';
import type { PaginatedResponse } from '@shared/application/dtos/paginated.response';
import type { RankedVideoListItemResponse } from '../dtos/ranked-video-list-item.response';
import type { GetRankedVideosQuery } from '../dtos/ranked-videos.query';
import type { VideoMetadataResponse } from '../dtos/video-metadata.response';
import type { ContinueWatchingItemResponse } from '../dtos/continue-watching-item.response';
import type { StudioVideoListItemResponse } from '../dtos/studio-video-list-item.response';
import type { VideosByCategoryResponse } from '../dtos/videos-by-category.response';
import type { ChannelVideoMembershipEligibilityMetrics } from '../../domain/repositories/video.repository';
import type { SearchPublicVideosQuery } from './video-search-query.service.interface';
import type {
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';

export const VIDEO_QUERY_SERVICE = Symbol('VIDEO_QUERY_SERVICE');

export interface PublicChannelVideoSummary {
  id: string;
  title: string;
  category: string;
  tags: string[];
  status: string;
  thumbnailUrl: string | null;
  publishedAt: Date | null;
}

export interface IVideoQueryService {
  getPublicVideoSummariesByChannel(
    channelId: string,
  ): Promise<PublicChannelVideoSummary[]>;
  getChannelMembershipEligibilityMetrics(
    channelId: string,
  ): Promise<ChannelVideoMembershipEligibilityMetrics>;
  getVideoMetadata(videoId: string): Promise<VideoMetadataResponse>;
  getLatestVideos(
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<VideoListItemResponse>>;
  getRankedVideos(
    query: GetRankedVideosQuery,
  ): Promise<PaginatedResponse<RankedVideoListItemResponse>>;
  getPublicVideosByChannelIds(
    channelIds: string[],
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<VideoListItemResponse>>;
  getStudioVideos(
    userId: string,
    filters: {
      page: number;
      limit: number;
      statuses?: VideoStatus[];
      visibilities?: VideoVisibility[];
    },
  ): Promise<PaginatedResponse<StudioVideoListItemResponse>>;
  getVideosByCategory(
    category: string,
    page: number,
    limit: number,
  ): Promise<VideosByCategoryResponse>;
  searchPublicVideos(
    query: SearchPublicVideosQuery,
  ): Promise<PaginatedResponse<VideoListItemResponse>>;
  getContinueWatching(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<ContinueWatchingItemResponse>>;
}
