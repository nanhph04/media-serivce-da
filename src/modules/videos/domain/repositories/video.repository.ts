import type { VideoEntity } from '../entities/video.entity';

export const VIDEO_REPOSITORY = Symbol('VIDEO_REPOSITORY');

export interface ChannelVideoMembershipEligibilityMetrics {
  readyVideoCount: number;
  totalVideoViews: number;
}

export interface StudioVideoFilters {
  limit: number;
  statuses?: string[];
  visibilities?: string[];
}

export interface PublicVideoSearchFilters {
  q?: string;
  category?: string;
  tags?: string[];
  limit: number;
}

export interface PublicVideosByCategoryPageFilters {
  category: string;
  page: number;
  limit: number;
}

export interface PublicVideosByCategoryPageResult {
  items: VideoEntity[];
  total: number;
}

export interface IVideoRepository {
  save(video: VideoEntity): Promise<void>;
  findById(id: string): Promise<VideoEntity | null>;
  findBasicById(id: string): Promise<VideoEntity | null>;
  deleteDraftById(id: string): Promise<void>;
  deleteFailedById(id: string): Promise<void>;
  findExpiredDrafts(cutoffDate: Date, limit: number): Promise<VideoEntity[]>;
  findStaleByStatus(
    status: string,
    cutoffDate: Date,
    limit: number,
  ): Promise<VideoEntity[]>;
  incrementViewCount(videoId: string): Promise<void>;
  incrementViewCountBy(videoId: string, delta: number): Promise<void>;
  getChannelMembershipEligibilityMetrics(
    channelId: string,
  ): Promise<ChannelVideoMembershipEligibilityMetrics>;
  findStudioByOwnerId(
    ownerId: string,
    filters: StudioVideoFilters,
  ): Promise<VideoEntity[]>;
  findPublicByChannelId(channelId: string): Promise<VideoEntity[]>;
  findLatestPublic(limit: number): Promise<VideoEntity[]>;
  findByCategory(category: string, limit: number): Promise<VideoEntity[]>;
  findByCategoryPaged(
    filters: PublicVideosByCategoryPageFilters,
  ): Promise<PublicVideosByCategoryPageResult>;
  searchPublic(filters: PublicVideoSearchFilters): Promise<VideoEntity[]>;
  findByChannelIds(channelIds: string[], limit: number): Promise<VideoEntity[]>;
}
