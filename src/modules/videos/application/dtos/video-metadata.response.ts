import type {
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';

export interface VideoMetadataResponse {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnailUrl: string | null;
  viewCount: number;
  status: VideoStatus;
  visibility: VideoVisibility;
  errorMessage: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
}
