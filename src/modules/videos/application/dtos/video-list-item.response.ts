import type { VideoEntity } from '../../domain/entities/video.entity';

export interface VideoListItemResponse {
  id: string;
  channelId: string;
  title: string;
  description: string;
  categories: string[];
  status: string;
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

export function mapVideoEntityToListItem(
  video: VideoEntity,
): VideoListItemResponse {
  return {
    id: video.id,
    channelId: video.channelId,
    title: video.title,
    description: video.description,
    categories: video.category.map((category) => category.slug),
    status: video.status,
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
