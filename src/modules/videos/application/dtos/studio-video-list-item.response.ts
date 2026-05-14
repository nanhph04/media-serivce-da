import type { VideoEntity } from '../../domain/entities/video.entity';
import {
  mapVideoStatusToJobFields,
  type VideoJobStatusFields,
} from './video-job-status';

export interface StudioVideoListItemResponse extends VideoJobStatusFields {
  id: string;
  channelId: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  status: string;
  visibility: string;
  price: number;
  requiredTierLevel: number | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  resolutions: string[];
  errorMessage: string | null;
  viewCount: number;
  publishedAt: Date | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: string | null;
  deleteReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function mapVideoEntityToStudioListItem(
  video: VideoEntity,
): StudioVideoListItemResponse {
  return {
    id: video.id,
    channelId: video.channelId,
    title: video.title,
    description: video.description,
    category: video.category.slug,
    tags: video.tags.map((tag) => tag.slug),
    status: video.status,
    visibility: video.visibility,
    price: video.price,
    requiredTierLevel: video.requiredTierLevel,
    thumbnailUrl: video.thumbnailUrl,
    durationSeconds: video.durationSeconds,
    resolutions: video.resolutions,
    errorMessage: video.errorMessage,
    ...mapVideoStatusToJobFields({
      status: video.status,
      errorMessage: video.errorMessage,
      moderationDetails: video.moderationDetails,
    }),
    viewCount: video.viewCount,
    publishedAt: video.publishedAt,
    isDeleted: video.isDeleted,
    deletedAt: video.deletedAt,
    deletedBy: video.deletedBy,
    deleteReason: video.deleteReason,
    createdAt: video.createdAt,
    updatedAt: video.updatedAt,
  };
}
