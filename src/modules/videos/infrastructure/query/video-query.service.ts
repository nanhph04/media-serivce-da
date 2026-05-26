import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import { NotFoundException } from '@shared/domain/exceptions/domain.exception';
import {
  createPagination,
  type PaginatedResponse,
} from '@shared/application/dtos/paginated.response';
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
import { mapVideoStatusToJobFields } from '../../application/dtos/video-job-status';
import { buildPublicThumbnailUrl } from '../../application/dtos/thumbnail-url';
import {
  type IVideoQueryService,
  PublicChannelVideoSummary,
} from '../../application/interfaces/video-query.service.interface';
import type { SearchPublicVideosQuery } from '../../application/interfaces/video-search-query.service.interface';
import { ChannelOrmEntity } from '../../../channels/infrastructure/persistence/channel.orm-entity';
import { ChannelStatus } from '../../../channels/domain/entities/channel.entity';
import { MembershipTierOrmEntity } from '../../../channels/infrastructure/persistence/membership-tier.orm-entity';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import {
  VideoDeletionStatus,
  VideoStatus,
  VideoThumbnailStatus,
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
  'membershipTiers' | 'publishedAt' | 'deletedAt' | 'updatedAt'
> & {
  membershipTiers: Array<
    Omit<
      VideoMetadataResponse['membershipTiers'][number],
      'createdAt' | 'updatedAt'
    > & {
      createdAt: string;
      updatedAt: string;
    }
  >;
  publishedAt: string | null;
  deletedAt: string | null;
  updatedAt: string;
};

@Injectable()
export class VideoQueryService implements IVideoQueryService {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @InjectRepository(VideoWatchProgressOrmEntity)
    private readonly watchProgressOrmRepository: Repository<VideoWatchProgressOrmEntity>,
    @InjectRepository(ChannelOrmEntity)
    private readonly channelOrmRepository: Repository<ChannelOrmEntity>,
    @InjectRepository(MembershipTierOrmEntity)
    private readonly membershipTierOrmRepository: Repository<MembershipTierOrmEntity>,
    private readonly cacheService: CacheService,
  ) {}

  async getPublicVideoSummariesByChannel(
    channelId: string,
  ): Promise<PublicChannelVideoSummary[]> {
    const videos = await this.videoRepository.findPublicByChannelId(channelId);

    return videos.map((video) => ({
      id: video.id,
      title: video.title,
      category: video.category.slug,
      tags: video.tags.map((tag) => tag.slug),
      status: video.status,
      thumbnailUrl: buildPublicThumbnailUrl(video),
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

    if (cached && this.isCachedMetadataComplete(cached)) {
      return this.cachedMetadataToResponse(cached);
    }

    const video = await this.videoRepository.findBasicById(videoId);
    if (
      !video ||
      video.status !== VideoStatus.READY ||
      video.visibility !== VideoVisibility.PUBLIC ||
      video.deletionStatus !== VideoDeletionStatus.ACTIVE
    ) {
      throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    }

    const channel = await this.channelOrmRepository.findOne({
      where: { id: video.channelId, status: ChannelStatus.ACTIVE },
      select: { id: true, name: true, avatarUrl: true },
    });
    if (!channel) {
      throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    }
    const membershipTiers = await this.membershipTierOrmRepository.find({
      where: { channelId: video.channelId },
      order: { level: 'ASC' },
    });

    const response: VideoMetadataResponse = {
      id: video.id,
      channelId: video.channelId,
      channelName: channel.name,
      avatarUrlChannel: channel.avatarUrl,
      membershipTiers,
      title: video.title,
      description: video.description,
      categoryId: video.category.id,
      category: video.category.slug,
      tagIds: video.tags.map((tag) => tag.id),
      tags: video.tags.map((tag) => tag.slug),
      thumbnailUrl: buildPublicThumbnailUrl(video),
      thumbnailSource: video.thumbnailSource,
      thumbnailStatus: video.thumbnailStatus,
      viewCount: video.viewCount,
      price: video.price,
      requiredTierLevel: video.requiredTierLevel,
      status: video.status,
      visibility: video.visibility,
      processingWarnings: video.processingWarnings,
      errorMessage: video.errorMessage,
      ...mapVideoStatusToJobFields({
        status: video.status,
        errorMessage: video.errorMessage,
        moderationDetails: video.moderationDetails,
      }),
      publishedAt: video.publishedAt,
      isDeleted: video.isDeleted,
      deletedAt: video.deletedAt,
      deletedBy: video.deletedBy,
      deleteReason: video.deleteReason,
      updatedAt: video.updatedAt,
    };

    await this.setCachedValue(
      cacheKey,
      this.metadataToCached(response),
      VIDEO_CACHE_TTL_SECONDS.metadata,
    );

    return response;
  }

  async getLatestVideos(
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<VideoListItemResponse>> {
    const version = await this.getCacheVersion(
      VIDEO_CACHE_KEYS.latestVersion(),
    );
    const cacheKey = VIDEO_CACHE_KEYS.latest(version, page, limit);
    const cached = await this.getCachedValue<{
      items: CachedVideoListItem[];
      total: number;
    }>(cacheKey);

    if (cached) {
      return {
        items: cached.items.map((item) => this.cachedListItemToResponse(item)),
        pagination: createPagination(page, limit, cached.total),
      };
    }

    const result = await this.videoRepository.findLatestPublic(page, limit);
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
      pagination: createPagination(page, limit, result.total),
    };
  }

  async getStudioVideos(
    userId: string,
    filters: {
      page: number;
      limit: number;
      statuses?: VideoStatus[];
      visibilities?: VideoVisibility[];
    },
  ): Promise<PaginatedResponse<StudioVideoListItemResponse>> {
    const result = await this.videoRepository.findStudioByOwnerId(userId, {
      page: filters.page,
      limit: filters.limit,
      statuses: filters.statuses,
      visibilities: filters.visibilities,
    });

    return {
      items: result.items.map(mapVideoEntityToStudioListItem),
      pagination: createPagination(filters.page, filters.limit, result.total),
    };
  }

  async getVideosByCategory(
    category: string,
    page: number,
    limit: number,
  ): Promise<VideosByCategoryResponse> {
    const version = await this.getCacheVersion(
      VIDEO_CACHE_KEYS.categoryLatestVersion(),
    );
    const cacheKey = VIDEO_CACHE_KEYS.categoryPage(
      version,
      category,
      page,
      limit,
    );
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
  ): Promise<PaginatedResponse<VideoListItemResponse>> {
    const version = await this.getCacheVersion(
      VIDEO_CACHE_KEYS.publicSearchVersion(),
    );
    const cacheKey = VIDEO_CACHE_KEYS.publicSearch(
      version,
      query.q,
      query.category,
      query.tags?.join(','),
      query.page,
      query.limit,
    );
    const cached = await this.getCachedValue<{
      items: CachedVideoListItem[];
      total: number;
    }>(cacheKey);

    if (cached) {
      return {
        items: cached.items.map((item) => this.cachedListItemToResponse(item)),
        pagination: createPagination(query.page, query.limit, cached.total),
      };
    }

    const result = await this.videoRepository.searchPublic(query);
    const items = result.items.map(mapVideoEntityToListItem);

    await this.setCachedValue(
      cacheKey,
      {
        items: items.map((item) => this.listItemToCached(item)),
        total: result.total,
      },
      VIDEO_CACHE_TTL_SECONDS.publicSearch,
    );

    return {
      items,
      pagination: createPagination(query.page, query.limit, result.total),
    };
  }

  async getContinueWatching(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<ContinueWatchingItemResponse>> {
    const queryBuilder = this.watchProgressOrmRepository
      .createQueryBuilder('progress')
      .innerJoin(VideoOrmEntity, 'video', 'video.id = progress.video_id')
      .innerJoin(ChannelOrmEntity, 'channel', 'channel.id = video.channel_id')
      .where('progress.user_id = :userId', { userId })
      .andWhere('progress.completed_at IS NULL')
      .andWhere('progress.last_position_seconds > 0')
      .andWhere('video.status = :status', { status: VideoStatus.READY })
      .andWhere('video.deletion_status = :deletionStatus', {
        deletionStatus: VideoDeletionStatus.ACTIVE,
      })
      .andWhere('video.visibility = :visibility', {
        visibility: VideoVisibility.PUBLIC,
      })
      .andWhere('channel.status = :channelStatus', {
        channelStatus: ChannelStatus.ACTIVE,
      });

    const total = await queryBuilder.getCount();

    const rows = await queryBuilder
      .orderBy('progress.last_watched_at', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .select([
        'progress.videoId AS "videoId"',
        'progress.channelId AS "channelId"',
        'progress.lastPositionSeconds AS "resumePositionSeconds"',
        'progress.durationSeconds AS "progressDurationSeconds"',
        'progress.lastWatchedAt AS "lastWatchedAt"',
        'video.title AS "title"',
        'video.thumbnailObjectKey AS "thumbnailObjectKey"',
        'video.thumbnailUrl AS "thumbnailUrl"',
        'video.thumbnailStatus AS "thumbnailStatus"',
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
        thumbnailObjectKey: string | null;
        thumbnailUrl: string | null;
        thumbnailStatus: VideoThumbnailStatus | string;
        videoDurationSeconds: number | string | null;
        viewCount: number | string;
      }>();

    const items = rows.map((row) => {
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
        thumbnailUrl:
          row.thumbnailStatus === VideoThumbnailStatus.READY &&
          row.thumbnailObjectKey &&
          row.thumbnailUrl
            ? row.thumbnailUrl
            : null,
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

    return {
      items,
      pagination: createPagination(page, limit, total),
    };
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
      thumbnailUrl:
        item.thumbnailStatus === VideoThumbnailStatus.READY && item.thumbnailUrl
          ? item.thumbnailUrl
          : null,
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
      thumbnailUrl:
        metadata.thumbnailStatus === VideoThumbnailStatus.READY &&
        metadata.thumbnailUrl
          ? metadata.thumbnailUrl
          : null,
      membershipTiers: metadata.membershipTiers.map((tier) => ({
        ...tier,
        createdAt: tier.createdAt.toISOString(),
        updatedAt: tier.updatedAt.toISOString(),
      })),
      publishedAt: metadata.publishedAt?.toISOString() ?? null,
      deletedAt: metadata.deletedAt?.toISOString() ?? null,
      updatedAt: metadata.updatedAt.toISOString(),
    };
  }

  private cachedMetadataToResponse(
    metadata: CachedVideoMetadata,
  ): VideoMetadataResponse {
    return {
      ...metadata,
      thumbnailUrl:
        metadata.thumbnailStatus === VideoThumbnailStatus.READY &&
        metadata.thumbnailUrl
          ? metadata.thumbnailUrl
          : null,
      membershipTiers: metadata.membershipTiers.map((tier) => ({
        ...tier,
        createdAt: new Date(tier.createdAt),
        updatedAt: new Date(tier.updatedAt),
      })),
      publishedAt: metadata.publishedAt ? new Date(metadata.publishedAt) : null,
      isDeleted: metadata.isDeleted ?? false,
      deletedAt: metadata.deletedAt ? new Date(metadata.deletedAt) : null,
      deletedBy: metadata.deletedBy ?? null,
      deleteReason: metadata.deleteReason ?? null,
      updatedAt: new Date(metadata.updatedAt),
    };
  }

  private isCachedMetadataComplete(
    metadata: CachedVideoMetadata,
  ): metadata is CachedVideoMetadata & {
    channelId: string;
    channelName: string;
    avatarUrlChannel: string;
  } {
    return (
      typeof metadata.channelId === 'string' &&
      typeof metadata.channelName === 'string' &&
      typeof metadata.avatarUrlChannel === 'string' &&
      Array.isArray(metadata.membershipTiers)
    );
  }

  private toPagination(
    page: number,
    limit: number,
    total: number,
  ): {
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
