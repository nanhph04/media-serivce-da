import type {
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import type { VideoJobStatusFields } from './video-job-status';

export interface VideoMetadataResponse extends VideoJobStatusFields {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  category: string;
  tagIds: string[];
  tags: string[];
  thumbnailUrl: string | null;
  viewCount: number;
  status: VideoStatus;
  visibility: VideoVisibility;
  errorMessage: string | null;
  publishedAt: Date | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: string | null;
  deleteReason: string | null;
  updatedAt: Date;
}
