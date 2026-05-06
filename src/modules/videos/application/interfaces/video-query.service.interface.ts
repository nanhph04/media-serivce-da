import type { VideoListItemResponse } from '../dtos/video-list-item.response';
import type { VideoMetadataResponse } from '../dtos/video-metadata.response';
import type { ContinueWatchingItemResponse } from '../dtos/continue-watching-item.response';
import type { StudioVideoListItemResponse } from '../dtos/studio-video-list-item.response';
import type { ChannelVideoMembershipEligibilityMetrics } from '../../domain/repositories/video.repository';
import type {
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';

export const VIDEO_QUERY_SERVICE = Symbol('VIDEO_QUERY_SERVICE');

export interface PublicChannelVideoSummary {
  id: string;
  title: string;
  categories: string[];
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
  getLatestVideos(limit: number): Promise<VideoListItemResponse[]>;
  getStudioVideos(
    userId: string,
    filters: {
      limit: number;
      statuses?: VideoStatus[];
      visibilities?: VideoVisibility[];
    },
  ): Promise<StudioVideoListItemResponse[]>;
  getVideosByCategory(
    category: string,
    limit: number,
  ): Promise<VideoListItemResponse[]>;
  getContinueWatching(
    userId: string,
    limit: number,
  ): Promise<ContinueWatchingItemResponse[]>;
}
