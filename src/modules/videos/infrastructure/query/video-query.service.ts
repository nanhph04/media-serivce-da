import { Inject, Injectable } from '@nestjs/common';
import { NotFoundException } from '@shared/domain/exceptions/domain.exception';
import { CacheService } from '@shared/infrastructure/cache/cache.service';
import {
  mapVideoEntityToListItem,
  type VideoListItemResponse,
} from '../../application/dtos/video-list-item.response';
import type { VideoMetadataResponse } from '../../application/dtos/video-metadata.response';
import {
  type IVideoQueryService,
  PublicChannelVideoSummary,
} from '../../application/interfaces/video-query.service.interface';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import {
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import {
  VIDEO_CACHE_KEYS,
  VIDEO_CACHE_TTL_SECONDS,
} from '../cache.constants';

type CachedVideoListItem = Omit<
  VideoListItemResponse,
  'publishedAt' | 'createdAt' | 'updatedAt'
> & {
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type CachedVideoMetadata = Omit<
  VideoMetadataResponse,
  'publishedAt' | 'updatedAt'
> & {
  publishedAt: string | null;
  updatedAt: string;
};

@Injectable()
export class VideoQueryService implements IVideoQueryService {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    private readonly cacheService: CacheService,
  ) {}

  async getPublicVideoSummariesByChannel(
    channelId: string,
  ): Promise<PublicChannelVideoSummary[]> {
    const videos = await this.videoRepository.findPublicByChannelId(channelId);

    return videos.map((video) => ({
      id: video.id,
      title: video.title,
      categories: video.category.map((category) => category.slug),
      status: video.status,
      thumbnailUrl: video.thumbnailUrl,
      publishedAt: video.publishedAt,
    }));
  }

  async getVideoMetadata(videoId: string): Promise<VideoMetadataResponse> {
    const cacheKey = VIDEO_CACHE_KEYS.metadata(videoId);
    const cached = await this.getCachedValue<CachedVideoMetadata>(cacheKey);

    if (cached) {
      return this.cachedMetadataToResponse(cached);
    }

    const video = await this.videoRepository.findById(videoId);
    if (
      !video ||
      video.status !== VideoStatus.PUBLIC ||
      video.visibility !== VideoVisibility.PUBLIC
    ) {
      throw new NotFoundException('Video not found');
    }

    const response: VideoMetadataResponse = {
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      status: video.status,
      visibility: video.visibility,
      publishedAt: video.publishedAt,
      updatedAt: video.updatedAt,
    };

    await this.setCachedValue(
      cacheKey,
      this.metadataToCached(response),
      VIDEO_CACHE_TTL_SECONDS.metadata,
    );

    return response;
  }

  async getLatestVideos(limit: number): Promise<VideoListItemResponse[]> {
    const cacheKey = VIDEO_CACHE_KEYS.latest(limit);
    const cached = await this.getCachedValue<CachedVideoListItem[]>(cacheKey);

    if (cached) {
      return cached.map((item) => this.cachedListItemToResponse(item));
    }

    const videos = await this.videoRepository.findLatestPublic(limit);
    const response = videos.map(mapVideoEntityToListItem);

    await this.setCachedValue(
      cacheKey,
      response.map((item) => this.listItemToCached(item)),
      VIDEO_CACHE_TTL_SECONDS.discoveryList,
    );

    return response;
  }

  async getVideosByCategory(
    category: string,
    limit: number,
  ): Promise<VideoListItemResponse[]> {
    const cacheKey = VIDEO_CACHE_KEYS.categoryLatest(category, limit);
    const cached = await this.getCachedValue<CachedVideoListItem[]>(cacheKey);

    if (cached) {
      return cached.map((item) => this.cachedListItemToResponse(item));
    }

    const videos = await this.videoRepository.findByCategory(category, limit);
    const response = videos.map(mapVideoEntityToListItem);

    await this.setCachedValue(
      cacheKey,
      response.map((item) => this.listItemToCached(item)),
      VIDEO_CACHE_TTL_SECONDS.discoveryList,
    );

    return response;
  }

  private async getCachedValue<T>(key: string): Promise<T | null> {
    try {
      return await this.cacheService.get<T>(key);
    } catch {
      return null;
    }
  }

  private async setCachedValue(
    key: string,
    value: unknown,
    ttlSeconds: number,
  ): Promise<void> {
    try {
      await this.cacheService.set(key, value, ttlSeconds);
    } catch {
      // Cache write failure must not fail reads.
    }
  }

  private listItemToCached(
    item: VideoListItemResponse,
  ): CachedVideoListItem {
    return {
      ...item,
      publishedAt: item.publishedAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private cachedListItemToResponse(
    item: CachedVideoListItem,
  ): VideoListItemResponse {
    return {
      ...item,
      publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    };
  }

  private metadataToCached(
    metadata: VideoMetadataResponse,
  ): CachedVideoMetadata {
    return {
      ...metadata,
      publishedAt: metadata.publishedAt?.toISOString() ?? null,
      updatedAt: metadata.updatedAt.toISOString(),
    };
  }

  private cachedMetadataToResponse(
    metadata: CachedVideoMetadata,
  ): VideoMetadataResponse {
    return {
      ...metadata,
      publishedAt: metadata.publishedAt
        ? new Date(metadata.publishedAt)
        : null,
      updatedAt: new Date(metadata.updatedAt),
    };
  }
}
