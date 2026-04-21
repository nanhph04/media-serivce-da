import type {
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';

export interface VideoMetadataResponse {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  status: VideoStatus;
  visibility: VideoVisibility;
  publishedAt: Date | null;
  updatedAt: Date;
}
