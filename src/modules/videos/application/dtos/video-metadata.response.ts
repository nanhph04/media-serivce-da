import type {
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';

export interface VideoMetadataResponse {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  viewCount: number;
  status: VideoStatus;
  visibility: VideoVisibility;
  publishedAt: Date | null;
  updatedAt: Date;
}
