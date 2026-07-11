import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import { NotFoundException } from '@shared/domain/exceptions/domain.exception';
import {
  OBJECT_STORAGE_SERVICE,
  type IObjectStorageService,
} from '@shared/application/interfaces/object-storage.service.interface';
import {
  createPagination,
  type PaginatedResponse,
} from '@shared/application/dtos/paginated.response';
import { CacheService } from '@shared/infrastructure/cache/cache.service';
import {
  In,
  MoreThan,
  Repository,
  type ObjectLiteral,
  type SelectQueryBuilder,
} from 'typeorm';
import type { ContinueWatchingItemResponse } from '../../application/dtos/continue-watching-item.response';
import type { RankedVideoListItemResponse } from '../../application/dtos/ranked-video-list-item.response';
import type {
  GetRankedVideosQuery,
  VideoRankingPeriod,
} from '../../application/dtos/ranked-videos.query';
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
import { buildChannelImageUrl } from '../../../channels/application/dtos/channel-image-url';
import { ChannelOrmEntity } from '../../../channels/infrastructure/persistence/channel.orm-entity';
import { ChannelStatus } from '../../../channels/domain/entities/channel.entity';
import { MembershipTierOrmEntity } from '../../../channels/infrastructure/persistence/membership-tier.orm-entity';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import {
  CHANNEL_ACCESS_SERVICE,
  type IChannelAccessService,
} from '../../../channels/application/interfaces/channel-access.service.interface';
import {
  type IVideoPurchaseUnlockRepository,
  VIDEO_PURCHASE_UNLOCK_REPOSITORY,
} from '../../domain/repositories/video-purchase-unlock.repository';
import {
  type VideoEntity,
  VideoDeletionStatus,
  VideoStatus,
  VideoThumbnailStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { VIDEO_CACHE_KEYS, VIDEO_CACHE_TTL_SECONDS } from '../cache.constants';
import { VideoPurchaseUnlockOrmEntity } from '../persistence/video-purchase-unlock.orm-entity';
import { VideoViewDailyStatOrmEntity } from '../persistence/video-view-daily-stat.orm-entity';
import { VideoWatchProgressOrmEntity } from '../persistence/video-watch-progress.orm-entity';
import { VideoOrmEntity } from '../persistence/video.orm-entity';
import { VideoUploadSessionOrmEntity } from '../persistence/video-upload-session.orm-entity';
import {
  type VideoUploadSession,
  VideoUploadSessionStatus,
} from '../../domain/repositories/video-upload-session.repository';

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
    @Inject(VIDEO_PURCHASE_UNLOCK_REPOSITORY)
    private readonly unlockRepository: IVideoPurchaseUnlockRepository,
    @Inject(CHANNEL_ACCESS_SERVICE)
    private readonly channelAccessService: IChannelAccessService,
    @InjectRepository(VideoWatchProgressOrmEntity)
    private readonly watchProgressOrmRepository: Repository<VideoWatchProgressOrmEntity>,
    @InjectRepository(ChannelOrmEntity)
    private readonly channelOrmRepository: Repository<ChannelOrmEntity>,
    @InjectRepository(MembershipTierOrmEntity)
    private readonly membershipTierOrmRepository: Repository<MembershipTierOrmEntity>,
    @InjectRepository(VideoUploadSessionOrmEntity)
    private readonly uploadSessionOrmRepository: Repository<VideoUploadSessionOrmEntity>,
    private readonly cacheService: CacheService,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService?: IObjectStorageService,
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
      thumbnailUrl: buildPublicThumbnailUrl(video, this.objectStorageService),
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

  async getVideoMetadata(
    videoId: string,
    viewerUserId?: string | null,
  ): Promise<VideoMetadataResponse> {
    const cacheKey = VIDEO_CACHE_KEYS.metadata(videoId);
    const canUsePublicCache = !viewerUserId;
    const cached = canUsePublicCache
      ? await this.getCachedValue<CachedVideoMetadata>(cacheKey)
      : null;

    if (cached && this.isCachedMetadataComplete(cached)) {
      return this.cachedMetadataToResponse(cached);
    }

    const video = await this.videoRepository.findBasicById(videoId);
    if (
      !video ||
      video.status !== VideoStatus.READY ||
      video.deletionStatus !== VideoDeletionStatus.ACTIVE
    ) {
      throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    }

    const channel = await this.channelOrmRepository.findOne({
      where: { id: video.channelId, status: ChannelStatus.ACTIVE },
      select: { id: true, name: true, avatarUrl: true, avatarObjectKey: true },
    });
    if (!channel) {
      throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    }
    const viewerAccess = await this.resolveViewerAccess(video, viewerUserId);
    if (video.visibility !== VideoVisibility.PUBLIC && !viewerAccess.canViewMetadata) {
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
      avatarUrlChannel: buildChannelImageUrl(
        channel.avatarObjectKey,
        channel.avatarUrl,
        this.objectStorageService,
      ),
      membershipTiers,
      title: video.title,
      description: video.description,
      categoryId: video.category.id,
      category: video.category.slug,
      tagIds: video.tags.map((tag) => tag.id),
      tags: video.tags.map((tag) => tag.slug),
      thumbnailUrl: buildPublicThumbnailUrl(video, this.objectStorageService),
      thumbnailSource: video.thumbnailSource,
      thumbnailStatus: video.thumbnailStatus,
      viewCount: video.viewCount,
      price: video.price,
      requiredTierLevel: video.requiredTierLevel,
      status: video.status,
      visibility: video.visibility,
      viewerAccess: {
        isOwner: viewerAccess.isOwner,
        hasPurchased: viewerAccess.hasPurchased,
        activeMembershipTierLevel: viewerAccess.activeMembershipTierLevel,
        canWatch: viewerAccess.canWatch,
        needsMembershipUpgrade: viewerAccess.needsMembershipUpgrade,
      },
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

    if (canUsePublicCache && video.visibility === VideoVisibility.PUBLIC) {
      await this.setCachedValue(
        cacheKey,
        this.metadataToCached(response),
        VIDEO_CACHE_TTL_SECONDS.metadata,
      );
    }

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
    const items = await this.withChannelNames(
      result.items.map((video) =>
        mapVideoEntityToListItem(video, this.objectStorageService),
      ),
    );

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

  async getRankedVideos(
    query: GetRankedVideosQuery,
  ): Promise<PaginatedResponse<RankedVideoListItemResponse>> {
    const fromDate = this.getPeriodStartDate(query.period);
    const result =
      query.metric === 'purchases'
        ? await this.getPurchasedVideoRankRows(
            fromDate,
            query.page,
            query.limit,
          )
        : await this.getViewedVideoRankRows(fromDate, query.page, query.limit);

    const videoIds = result.rows.map((row) => row.videoId);
    const items = await this.findRankedVideoItems(videoIds, result.rows);

    return {
      items,
      pagination: createPagination(query.page, query.limit, result.total),
    };
  }

  async getPublicVideosByChannelIds(
    channelIds: string[],
    page: number,
    limit: number,
    options: { includePrivate?: boolean } = {},
  ): Promise<PaginatedResponse<VideoListItemResponse>> {
    const result = await this.videoRepository.findByChannelIds(
      channelIds,
      page,
      limit,
      options,
    );

    return {
      items: await this.withChannelNames(
        result.items.map((video) =>
          mapVideoEntityToListItem(video, this.objectStorageService),
        ),
      ),
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

    const activeUploadSessionsByVideoId =
      await this.getActiveDraftUploadSessionsByVideoId(result.items);

    return {
      items: result.items.map((video) =>
        mapVideoEntityToStudioListItem(
          video,
          this.objectStorageService,
          activeUploadSessionsByVideoId.get(video.id) ?? null,
        ),
      ),
      pagination: createPagination(filters.page, filters.limit, result.total),
    };
  }

  private async resolveViewerAccess(
    video: VideoEntity,
    viewerUserId?: string | null,
  ): Promise<{
    canViewMetadata: boolean;
    isOwner: boolean;
    hasPurchased: boolean;
    activeMembershipTierLevel: number | null;
    canWatch: boolean;
    needsMembershipUpgrade: boolean;
  }> {
    const isPublic = video.visibility === VideoVisibility.PUBLIC;

    if (!viewerUserId) {
      return {
        canViewMetadata: isPublic,
        isOwner: false,
        hasPurchased: false,
        activeMembershipTierLevel: null,
        canWatch:
          isPublic && video.price === 0 && video.requiredTierLevel === null,
        needsMembershipUpgrade: false,
      };
    }

    const accessContext =
      await this.channelAccessService.getViewerAccessContext(
        video.channelId,
        viewerUserId,
      );
    const isOwner = accessContext.channelOwnerId === viewerUserId;

    if (isOwner) {
      return {
        canViewMetadata: true,
        isOwner: true,
        hasPurchased: false,
        activeMembershipTierLevel: accessContext.activeMembershipTierLevel,
        canWatch: Boolean(video.masterPlaylistKey),
        needsMembershipUpgrade: false,
      };
    }

    const hasPurchased = await this.unlockRepository.exists(
      video.id,
      viewerUserId,
    );
    const hasAnyMembership = accessContext.activeMembershipTierLevel !== null;
    const hasUnrestrictedMembershipAccess =
      hasAnyMembership && video.requiredTierLevel === null;
    const hasRequiredMembership =
      video.requiredTierLevel !== null &&
      accessContext.activeMembershipTierLevel !== null &&
      accessContext.activeMembershipTierLevel >= video.requiredTierLevel;
    const needsMembershipUpgrade =
      video.requiredTierLevel !== null &&
      accessContext.activeMembershipTierLevel !== null &&
      accessContext.activeMembershipTierLevel < video.requiredTierLevel;
    const canWatchFreePublic =
      isPublic && video.price === 0 && video.requiredTierLevel === null;

    return {
      canViewMetadata: isPublic || hasPurchased || hasAnyMembership,
      isOwner: false,
      hasPurchased,
      activeMembershipTierLevel: accessContext.activeMembershipTierLevel,
      canWatch:
        hasPurchased ||
        hasUnrestrictedMembershipAccess ||
        hasRequiredMembership ||
        canWatchFreePublic,
      needsMembershipUpgrade,
    };
  }

  private async getActiveDraftUploadSessionsByVideoId(
    videos: VideoEntity[],
  ): Promise<
    Map<
      string,
      Pick<
        VideoUploadSession,
        | 'uploadId'
        | 'partSizeBytes'
        | 'status'
        | 'expiresAt'
        | 'fileName'
        | 'fileSize'
      >
    >
  > {
    const draftVideoIds = videos
      .filter((video) => video.status === VideoStatus.DRAFT)
      .map((video) => video.id);

    if (draftVideoIds.length === 0) {
      return new Map();
    }

    const sessions = await this.uploadSessionOrmRepository.find({
      where: {
        videoId: In(draftVideoIds),
        status: In([
          VideoUploadSessionStatus.ACTIVE,
          VideoUploadSessionStatus.COMPLETED,
        ]),
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });

    const sessionsByVideoId = new Map<
      string,
      Pick<
        VideoUploadSession,
        | 'uploadId'
        | 'partSizeBytes'
        | 'status'
        | 'expiresAt'
        | 'fileName'
        | 'fileSize'
      >
    >();

    for (const session of sessions) {
      if (sessionsByVideoId.has(session.videoId)) {
        continue;
      }

      sessionsByVideoId.set(session.videoId, {
        uploadId: session.uploadId,
        partSizeBytes: session.partSizeBytes,
        status: session.status,
        expiresAt: session.expiresAt,
        fileName: session.fileName,
        fileSize: Number(session.fileSize),
      });
    }

    return sessionsByVideoId;
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
    const items = await this.withChannelNames(
      result.items.map((video) =>
        mapVideoEntityToListItem(video, this.objectStorageService),
      ),
    );

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
    const items = await this.withChannelNames(
      result.items.map((video) =>
        mapVideoEntityToListItem(video, this.objectStorageService),
      ),
    );

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
          row.thumbnailStatus === VideoThumbnailStatus.READY
            ? row.thumbnailObjectKey
              ? (this.objectStorageService?.createObjectUrl(
                  'public',
                  row.thumbnailObjectKey,
                ) ?? row.thumbnailUrl)
              : row.thumbnailUrl
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

  private async getPurchasedVideoRankRows(
    fromDate: Date,
    page: number,
    limit: number,
  ): Promise<{
    rows: Array<{ videoId: string; metricCount: number }>;
    total: number;
  }> {
    const baseQueryBuilder = this.watchProgressOrmRepository.manager
      .createQueryBuilder(VideoPurchaseUnlockOrmEntity, 'unlock')
      .innerJoin(VideoOrmEntity, 'video', 'video.id = unlock.video_id')
      .innerJoin(ChannelOrmEntity, 'channel', 'channel.id = video.channel_id')
      .where('unlock.created_at >= :fromDate', { fromDate })
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

    return this.getRankRowsFromQueryBuilder(
      baseQueryBuilder,
      'unlock.id',
      page,
      limit,
    );
  }

  private async getViewedVideoRankRows(
    fromDate: Date,
    page: number,
    limit: number,
  ): Promise<{
    rows: Array<{ videoId: string; metricCount: number }>;
    total: number;
  }> {
    const baseQueryBuilder = this.watchProgressOrmRepository.manager
      .createQueryBuilder(VideoViewDailyStatOrmEntity, 'stat')
      .innerJoin(VideoOrmEntity, 'video', 'video.id = stat.video_id')
      .innerJoin(ChannelOrmEntity, 'channel', 'channel.id = video.channel_id')
      .where('stat.stat_date >= :fromDate', {
        fromDate: this.toUtcDateString(fromDate),
      })
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

    return this.getRankRowsFromQueryBuilder(
      baseQueryBuilder,
      'stat.view_count',
      page,
      limit,
      true,
    );
  }

  private async getRankRowsFromQueryBuilder<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    metricExpression: string,
    page: number,
    limit: number,
    shouldSumMetric = false,
  ): Promise<{
    rows: Array<{ videoId: string; metricCount: number }>;
    total: number;
  }> {
    const totalRaw = await queryBuilder
      .clone()
      .select('COUNT(DISTINCT video.id)', 'total')
      .getRawOne<{ total?: string | number | null }>();

    const aggregationExpression = shouldSumMetric
      ? `COALESCE(SUM(${metricExpression}), 0)`
      : `COUNT(${metricExpression})`;

    const metricCountAlias = 'metric_count';
    const rows = await queryBuilder
      .clone()
      .select('video.id', 'videoId')
      .addSelect(aggregationExpression, metricCountAlias)
      .groupBy('video.id')
      .addGroupBy('video.published_at')
      .addGroupBy('video.created_at')
      .orderBy(metricCountAlias, 'DESC')
      .addOrderBy('video.published_at', 'DESC')
      .addOrderBy('video.created_at', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<{ videoId: string; metric_count: string | number }>();

    return {
      rows: rows.map((row) => ({
        videoId: row.videoId,
        metricCount: Number(row.metric_count),
      })),
      total: Number(totalRaw?.total ?? 0),
    };
  }

  private async findRankedVideoItems(
    videoIds: string[],
    rankRows: Array<{ videoId: string; metricCount: number }>,
  ): Promise<RankedVideoListItemResponse[]> {
    if (videoIds.length === 0) {
      return [];
    }

    const rows = await this.watchProgressOrmRepository.manager
      .createQueryBuilder(VideoOrmEntity, 'video')
      .leftJoinAndSelect('video.category', 'category')
      .leftJoinAndSelect('video.videoTags', 'videoTag')
      .leftJoinAndSelect('videoTag.tag', 'tag')
      .innerJoin(ChannelOrmEntity, 'channel', 'channel.id = video.channel_id')
      .addSelect('channel.name', 'channelName')
      .where('video.id IN (:...videoIds)', { videoIds })
      .andWhere('channel.status = :channelStatus', {
        channelStatus: ChannelStatus.ACTIVE,
      })
      .andWhere('video.status = :status', { status: VideoStatus.READY })
      .andWhere('video.deletion_status = :deletionStatus', {
        deletionStatus: VideoDeletionStatus.ACTIVE,
      })
      .andWhere('video.visibility = :visibility', {
        visibility: VideoVisibility.PUBLIC,
      })
      .getRawAndEntities();

    const channelNameByVideoId = new Map(
      rows.raw.map((row: { video_id: string; channelName: string | null }) => [
        row.video_id,
        row.channelName,
      ]),
    );
    const videoById = new Map(rows.entities.map((video) => [video.id, video]));
    const metricCountByVideoId = new Map(
      rankRows.map((row) => [row.videoId, row.metricCount]),
    );

    return videoIds
      .map((videoId) => {
        const video = videoById.get(videoId);

        if (!video) {
          return null;
        }

        return {
          ...this.mapVideoOrmToListItem(video),
          channelName: channelNameByVideoId.get(videoId) ?? null,
          metricCount: metricCountByVideoId.get(videoId) ?? 0,
        };
      })
      .filter((item): item is RankedVideoListItemResponse => item !== null);
  }

  private mapVideoOrmToListItem(video: VideoOrmEntity): VideoListItemResponse {
    const category = video.category;

    if (!category) {
      throw new Error(`Video ${video.id} is missing category relation`);
    }

    return {
      id: video.id,
      channelId: video.channelId,
      channelName: null,
      title: video.title,
      description: video.description,
      category: category.slug,
      tags: (video.videoTags ?? []).map((item) => item.tag.slug),
      status: video.status,
      price: video.price,
      requiredTierLevel: video.requiredTierLevel,
      thumbnailUrl:
        video.thumbnailStatus === VideoThumbnailStatus.READY
          ? video.thumbnailObjectKey
            ? (this.objectStorageService?.createObjectUrl(
                'public',
                video.thumbnailObjectKey,
              ) ?? video.thumbnailUrl)
            : video.thumbnailUrl
          : null,
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

  private async withChannelNames(
    items: VideoListItemResponse[],
  ): Promise<VideoListItemResponse[]> {
    const channelIds = [
      ...new Set(items.map((item) => item.channelId).filter(Boolean)),
    ];

    if (channelIds.length === 0) {
      return items;
    }

    const channels = await this.channelOrmRepository.find({
      select: {
        id: true,
        name: true,
      },
      where: {
        id: In(channelIds),
      },
    });
    const channelNameById = new Map(
      channels.map((channel) => [channel.id, channel.name]),
    );

    return items.map((item) => ({
      ...item,
      channelName: channelNameById.get(item.channelId) ?? null,
    }));
  }

  private getPeriodStartDate(period: VideoRankingPeriod): Date {
    const now = new Date();
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    if (period === 'week') {
      start.setUTCDate(start.getUTCDate() - 6);
    }

    if (period === 'month') {
      start.setUTCDate(start.getUTCDate() - 29);
    }

    return start;
  }

  private toUtcDateString(date: Date): string {
    return date.toISOString().slice(0, 10);
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
      viewerAccess: metadata.viewerAccess ?? {
        isOwner: false,
        hasPurchased: false,
        activeMembershipTierLevel: null,
        canWatch:
          metadata.visibility === VideoVisibility.PUBLIC &&
          metadata.price === 0 &&
          metadata.requiredTierLevel === null,
        needsMembershipUpgrade: false,
      },
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
