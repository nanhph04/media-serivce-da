import type { VideoEntity } from '../../domain/entities/video.entity';
import { buildPublicThumbnailUrl } from './thumbnail-url';

export interface VideoListItemResponse {
  id: string;
  channelId: string;
  channelName: string | null;
  title: string;
  description: string;
  category: string;
  tags: string[];
  status: string;
  price: number;
  requiredTierLevel: number | null;
  thumbnailUrl: string | null;
  thumbnailSource: string;
  thumbnailStatus: string;
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
    channelName: null,
    title: video.title,
    description: video.description,
    category: video.category.slug,
    tags: video.tags.map((tag) => tag.slug),
    status: video.status,
    price: video.price,
    requiredTierLevel: video.requiredTierLevel,
    thumbnailUrl: buildPublicThumbnailUrl(video),
    thumbnailSource: video.thumbnailSource,
    thumbnailStatus: video.thumbnailStatus,
    durationSeconds: video.durationSeconds,
    resolutions: video.resolutions,
    errorMessage: video.errorMessage,
    viewCount: video.viewCount,
    publishedAt: video.publishedAt,
    createdAt: video.createdAt,
    updatedAt: video.updatedAt,
  };
}
