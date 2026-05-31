import type { VideoEntity } from '../entities/video.entity';
import type { VideoStatus, VideoVisibility } from '../entities/video.entity';

export const VIDEO_REPOSITORY = Symbol('VIDEO_REPOSITORY');

export interface ChannelVideoMembershipEligibilityMetrics {
  readyVideoCount: number;
  totalVideoViews: number;
}

export interface StudioVideoFilters {
  page: number;
  limit: number;
  statuses?: VideoStatus[];
  visibilities?: VideoVisibility[];
}

export interface PublicVideoSearchFilters {
  q?: string;
  category?: string;
  tags?: string[];
  page: number;
  limit: number;
}

export interface VideoPageResult {
  items: VideoEntity[];
  total: number;
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

export interface AdminChannelVideoMetrics {
  activeCreators30d: number;
  uploadingNow: number;
}

export interface AdminVideoFilters {
  page: number;
  limit: number;
  status?: VideoStatus;
  visibility?: VideoVisibility;
  channelId?: string;
  ownerId?: string;
  q?: string;
}

export interface AdminVideosPage {
  items: VideoEntity[];
  total: number;
}

export interface IVideoRepository {
  save(video: VideoEntity): Promise<void>;
  findById(id: string): Promise<VideoEntity | null>;
  findBasicById(id: string): Promise<VideoEntity | null>;
  deleteDraftById(id: string): Promise<void>;
  deleteFailedById(id: string): Promise<void>;
  hardDeleteById(id: string): Promise<void>;
  findExpiredDrafts(cutoffDate: Date, limit: number): Promise<VideoEntity[]>;
  findReadyForHardDelete(limit: number): Promise<VideoEntity[]>;
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
  ): Promise<VideoPageResult>;
  findPublicByChannelId(channelId: string): Promise<VideoEntity[]>;
  findLatestPublic(page: number, limit: number): Promise<VideoPageResult>;
  findByCategory(category: string, limit: number): Promise<VideoEntity[]>;
  findByCategoryPaged(
    filters: PublicVideosByCategoryPageFilters,
  ): Promise<PublicVideosByCategoryPageResult>;
  searchPublic(filters: PublicVideoSearchFilters): Promise<VideoPageResult>;
  findByChannelIds(
    channelIds: string[],
    page: number,
    limit: number,
  ): Promise<VideoPageResult>;
  getAdminChannelVideoMetrics(now: Date): Promise<AdminChannelVideoMetrics>;
  findAdminVideoById(id: string): Promise<VideoEntity | null>;
  findAdminVideos(filters: AdminVideoFilters): Promise<AdminVideosPage>;
}
