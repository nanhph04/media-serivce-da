import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotFoundException } from '@shared/domain/exceptions/domain.exception';
import { CacheService } from '@shared/infrastructure/cache/cache.service';
import { Repository } from 'typeorm';
import type { ContinueWatchingItemResponse } from '../../application/dtos/continue-watching-item.response';
import {
  mapVideoEntityToStudioListItem,
  type StudioVideoListItemResponse,
} from '../../application/dtos/studio-video-list-item.response';
import type { VideosByCategoryResponse } from '../../application/dtos/videos-by-category.response';
import {
  mapVideoEntityToListItem,
  type VideoListItemResponse,
} from '../../application/dtos/video-list-item.response';
import type { VideoMetadataResponse } from '../../application/dtos/video-metadata.response';
import {
  type IVideoQueryService,
  PublicChannelVideoSummary,
} from '../../application/interfaces/video-query.service.interface';
import type { SearchPublicVideosQuery } from '../../application/interfaces/video-search-query.service.interface';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import {
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { VIDEO_CACHE_KEYS, VIDEO_CACHE_TTL_SECONDS } from '../cache.constants';
import { VideoWatchProgressOrmEntity } from '../persistence/video-watch-progress.orm-entity';
import { VideoOrmEntity } from '../persistence/video.orm-entity';

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
    @InjectRepository(VideoWatchProgressOrmEntity)
    private readonly watchProgressOrmRepository: Repository<VideoWatchProgressOrmEntity>,
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

  async getChannelMembershipEligibilityMetrics(
    channelId: string,
  ): Promise<{ readyVideoCount: number; totalVideoViews: number }> {
    return this.videoRepository.getChannelMembershipEligibilityMetrics(
      channelId,
    );
  }

  async getVideoMetadata(videoId: string): Promise<VideoMetadataResponse> {
    const cacheKey = VIDEO_CACHE_KEYS.metadata(videoId);
    const cached = await this.getCachedValue<CachedVideoMetadata>(cacheKey);

    if (cached) {
      return this.cachedMetadataToResponse(cached);
    }

    const video = await this.videoRepository.findBasicById(videoId);
    if (
      !video ||
      video.status !== VideoStatus.READY ||
      video.visibility !== VideoVisibility.PUBLIC
    ) {
      throw new NotFoundException('Video not found');
    }

    const response: VideoMetadataResponse = {
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      viewCount: video.viewCount,
      status: video.status,
      visibility: video.visibility,
      errorMessage: video.errorMessage,
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
    const version = await this.getCacheVersion(
      VIDEO_CACHE_KEYS.latestVersion(),
    );
    const cacheKey = VIDEO_CACHE_KEYS.latest(version, limit);
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

  async getStudioVideos(
    userId: string,
    filters: {
      limit: number;
      statuses?: VideoStatus[];
      visibilities?: VideoVisibility[];
    },
  ): Promise<StudioVideoListItemResponse[]> {
    const videos = await this.videoRepository.findStudioByOwnerId(userId, {
      limit: filters.limit,
      statuses: filters.statuses,
      visibilities: filters.visibilities,
    });

    return videos.map(mapVideoEntityToStudioListItem);
  }

  async getVideosByCategory(
    category: string,
    page: number,
    limit: number,
  ): Promise<VideosByCategoryResponse> {
    const version = await this.getCacheVersion(
      VIDEO_CACHE_KEYS.categoryLatestVersion(),
    );
    const cacheKey = VIDEO_CACHE_KEYS.categoryPage(version, category, page, limit);
    const cached = await this.getCachedValue<{
      items: CachedVideoListItem[];
      total: number;
    }>(cacheKey);

    if (cached) {
      return {
        items: cached.items.map((item) => this.cachedListItemToResponse(item)),
        pagination: this.toPagination(page, limit, cached.total),
      };
    }

    const result = await this.videoRepository.findByCategoryPaged({
      category,
      page,
      limit,
    });
    const items = result.items.map(mapVideoEntityToListItem);

    await this.setCachedValue(
      cacheKey,
      {
        items: items.map((item) => this.listItemToCached(item)),
        total: result.total,
      },
      VIDEO_CACHE_TTL_SECONDS.discoveryList,
    );

    return {
      items,
      pagination: this.toPagination(page, limit, result.total),
    };
  }

  async searchPublicVideos(
    query: SearchPublicVideosQuery,
  ): Promise<VideoListItemResponse[]> {
    const cacheKey = VIDEO_CACHE_KEYS.publicSearch(
      query.q,
      query.category,
      query.limit,
    );
    const cached = await this.getCachedValue<CachedVideoListItem[]>(cacheKey);

    if (cached) {
      return cached.map((item) => this.cachedListItemToResponse(item));
    }

    const videos = await this.videoRepository.searchPublic(query);
    const response = videos.map(mapVideoEntityToListItem);

    await this.setCachedValue(
      cacheKey,
      response.map((item) => this.listItemToCached(item)),
      VIDEO_CACHE_TTL_SECONDS.publicSearch,
    );

    return response;
  }

  async getContinueWatching(
    userId: string,
    limit: number,
  ): Promise<ContinueWatchingItemResponse[]> {
    const rows = await this.watchProgressOrmRepository
      .createQueryBuilder('progress')
      .innerJoin(VideoOrmEntity, 'video', 'video.id = progress.video_id')
      .where('progress.user_id = :userId', { userId })
      .andWhere('progress.completed_at IS NULL')
      .andWhere('progress.last_position_seconds > 0')
      .andWhere('video.status = :status', { status: VideoStatus.READY })
      .andWhere('video.visibility = :visibility', {
        visibility: VideoVisibility.PUBLIC,
      })
      .orderBy('progress.last_watched_at', 'DESC')
      .take(limit)
      .select([
        'progress.videoId AS "videoId"',
        'progress.channelId AS "channelId"',
        'progress.lastPositionSeconds AS "resumePositionSeconds"',
        'progress.durationSeconds AS "progressDurationSeconds"',
        'progress.lastWatchedAt AS "lastWatchedAt"',
        'video.title AS "title"',
        'video.thumbnailUrl AS "thumbnailUrl"',
        'video.durationSeconds AS "videoDurationSeconds"',
        'video.viewCount AS "viewCount"',
      ])
      .getRawMany<{
        videoId: string;
        channelId: string;
        resumePositionSeconds: number | string;
        progressDurationSeconds: number | string | null;
        lastWatchedAt: Date | string;
        title: string;
        thumbnailUrl: string | null;
        videoDurationSeconds: number | string | null;
        viewCount: number | string;
      }>();

    return rows.map((row) => {
      const durationSeconds =
        row.videoDurationSeconds !== null
          ? Number(row.videoDurationSeconds)
          : row.progressDurationSeconds !== null
            ? Number(row.progressDurationSeconds)
            : null;
      const resumePositionSeconds = Number(row.resumePositionSeconds);

      return {
        videoId: row.videoId,
        channelId: row.channelId,
        title: row.title,
        thumbnailUrl: row.thumbnailUrl,
        durationSeconds,
        resumePositionSeconds,
        remainingSeconds:
          durationSeconds !== null
            ? Math.max(durationSeconds - resumePositionSeconds, 0)
            : null,
        lastWatchedAt: new Date(row.lastWatchedAt),
        viewCount: Number(row.viewCount),
      };
    });
  }

  private async getCachedValue<T>(key: string): Promise<T | null> {
    try {
      return await this.cacheService.get<T>(key);
    } catch {
      return null;
    }
  }

  private async getCacheVersion(key: string): Promise<number> {
    const version = await this.getCachedValue<number>(key);
    return typeof version === 'number' && Number.isFinite(version)
      ? version
      : 0;
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

  private listItemToCached(item: VideoListItemResponse): CachedVideoListItem {
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
      publishedAt: metadata.publishedAt ? new Date(metadata.publishedAt) : null,
      updatedAt: new Date(metadata.updatedAt),
    };
  }

  private toPagination(page: number, limit: number, total: number): {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } {
    return {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }
}
