import type { VideoEntity } from '../../domain/entities/video.entity';

export interface StudioVideoListItemResponse {
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
    viewCount: video.viewCount,
    publishedAt: video.publishedAt,
    createdAt: video.createdAt,
    updatedAt: video.updatedAt,
  };
}
