import type { VideoListItemResponse } from '../dtos/video-list-item.response';
import type { VideoMetadataResponse } from '../dtos/video-metadata.response';

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
  getVideoMetadata(videoId: string): Promise<VideoMetadataResponse>;
  getLatestVideos(limit: number): Promise<VideoListItemResponse[]>;
  getVideosByCategory(
    category: string,
    limit: number,
  ): Promise<VideoListItemResponse[]>;
}
