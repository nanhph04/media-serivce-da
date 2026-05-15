import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  In,
  LessThan,
  Repository,
  type FindOptionsWhere,
} from 'typeorm';
import {
  VideoDeletionStatus,
  VideoEntity,
  type VideoModerationDetails,
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { Category } from '../../../categories/domain/entities/category.entity';
import { Tag } from '../../../tags/domain/entities/tag.entity';
import type {
  PublicVideoSearchFilters,
  PublicVideosByCategoryPageFilters,
  PublicVideosByCategoryPageResult,
  IVideoRepository,
  StudioVideoFilters,
} from '../../domain/repositories/video.repository';
import { VideoPurchaseUnlockOrmEntity } from './video-purchase-unlock.orm-entity';
import { VideoTagOrmEntity } from './video-tag.orm-entity';
import { VideoWatchProgressOrmEntity } from './video-watch-progress.orm-entity';
import { VideoOrmEntity } from './video.orm-entity';

@Injectable()
export class VideoRepository implements IVideoRepository {
  constructor(
    @InjectRepository(VideoOrmEntity)
    private readonly ormRepository: Repository<VideoOrmEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async save(video: VideoEntity): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.save(VideoOrmEntity, {
        id: video.id,
        channelId: video.channelId,
        ownerId: video.ownerId,
        title: video.title,
        description: video.description,
        categoryId: video.category.id,
        visibility: video.visibility,
        status: video.status,
        price: video.price,
        requiredTierLevel: video.requiredTierLevel,
        rawFileKey: video.rawFileKey,
        masterPlaylistKey: video.masterPlaylistKey,
        thumbnailUrl: video.thumbnailUrl,
        durationSeconds: video.durationSeconds,
        resolutions: video.resolutions,
        errorMessage: video.errorMessage,
        moderationDetails: video.moderationDetails
          ? { ...video.moderationDetails }
          : null,
        viewCount: video.viewCount,
        publishedAt: video.publishedAt,
        isDeleted: video.isDeleted,
        deletedAt: video.deletedAt,
        deletedBy: video.deletedBy,
        deleteReason: video.deleteReason,
        deletionStatus: video.deletionStatus,
        deleteRequestedAt: video.deleteRequestedAt,
        refundCompletedAt: video.refundCompletedAt,
        refundSummary: video.refundSummary,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
        statusChangedAt: video.statusChangedAt,
      });

      await manager.delete(VideoTagOrmEntity, { videoId: video.id });

      if (video.tags.length > 0) {
        await manager.insert(
          VideoTagOrmEntity,
          video.tags.map((tag) => ({
            videoId: video.id,
            tagId: tag.id,
            createdAt: new Date(),
          })),
        );
      }
    });
  }

  async findById(id: string): Promise<VideoEntity | null> {
    const row = await this.ormRepository
      .createQueryBuilder('video')
      .leftJoinAndSelect('video.category', 'category')
      .leftJoinAndSelect('video.videoTags', 'videoTag')
      .leftJoinAndSelect('videoTag.tag', 'tag')
      .where('video.id = :id', { id })
      .getOne();

    return row ? this.toDomain(row) : null;
  }

  async findBasicById(id: string): Promise<VideoEntity | null> {
    const row = await this.ormRepository.findOne({
      where: { id },
      relations: { category: true, videoTags: { tag: true } },
    });
    return row ? this.toDomain(row) : null;
  }

  async deleteDraftById(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(VideoTagOrmEntity, { videoId: id });
      await manager.delete(VideoOrmEntity, {
        id,
        status: VideoStatus.DRAFT,
      });
    });
  }

  async deleteFailedById(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(VideoTagOrmEntity, { videoId: id });
      await manager.delete(VideoOrmEntity, {
        id,
        status: In([VideoStatus.FAILED, VideoStatus.REJECTED]),
      });
    });
  }

  async hardDeleteById(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(VideoWatchProgressOrmEntity, { videoId: id });
      await manager.delete(VideoPurchaseUnlockOrmEntity, { videoId: id });
      await manager.delete(VideoTagOrmEntity, { videoId: id });
      await manager.delete(VideoOrmEntity, {
        id,
        deletionStatus: VideoDeletionStatus.READY_FOR_HARD_DELETE,
      });
    });
  }

  async findExpiredDrafts(
    cutoffDate: Date,
    limit: number,
  ): Promise<VideoEntity[]> {
    const rows = await this.ormRepository.find({
      where: {
        status: VideoStatus.DRAFT,
        createdAt: LessThan(cutoffDate),
      },
      relations: { category: true, videoTags: { tag: true } },
      order: {
        createdAt: 'ASC',
      },
      take: limit,
    });

    return rows.map((row) => this.toDomain(row));
  }

  async findReadyForHardDelete(limit: number): Promise<VideoEntity[]> {
    const rows = await this.ormRepository.find({
      where: {
        deletionStatus: VideoDeletionStatus.READY_FOR_HARD_DELETE,
      },
      relations: { category: true, videoTags: { tag: true } },
      order: {
        updatedAt: 'ASC',
      },
      take: limit,
    });

    return rows.map((row) => this.toDomain(row));
  }

  async findStaleByStatus(
    status: string,
    cutoffDate: Date,
    limit: number,
  ): Promise<VideoEntity[]> {
    const rows = await this.ormRepository.find({
      where: {
        status: status as VideoStatus,
        statusChangedAt: LessThan(cutoffDate),
      },
      relations: { category: true, videoTags: { tag: true } },
      order: {
        statusChangedAt: 'ASC',
      },
      take: limit,
    });

    return rows.map((row) => this.toDomain(row));
  }

  async incrementViewCount(videoId: string): Promise<void> {
    await this.incrementViewCountBy(videoId, 1);
  }

  async incrementViewCountBy(videoId: string, delta: number): Promise<void> {
    await this.ormRepository
      .createQueryBuilder()
      .update(VideoOrmEntity)
      .set({
        viewCount: () => `"view_count" + ${delta}`,
        updatedAt: () => 'CURRENT_TIMESTAMP',
      })
      .where('id = :videoId', { videoId })
      .execute();
  }

  async getChannelMembershipEligibilityMetrics(
    channelId: string,
  ): Promise<{ readyVideoCount: number; totalVideoViews: number }> {
    const row = await this.ormRepository
      .createQueryBuilder('video')
      .select(
        'COALESCE(SUM(CASE WHEN video.status = :readyStatus THEN 1 ELSE 0 END), 0)',
        'readyVideoCount',
      )
      .addSelect('COALESCE(SUM(video.viewCount), 0)', 'totalVideoViews')
      .where('video.channelId = :channelId', { channelId })
      .setParameter('readyStatus', VideoStatus.READY)
      .getRawOne<{
        readyVideoCount?: string | number | null;
        totalVideoViews?: string | number | null;
      }>();

    return {
      readyVideoCount: Number(row?.readyVideoCount ?? 0),
      totalVideoViews: Number(row?.totalVideoViews ?? 0),
    };
  }

  async findStudioByOwnerId(
    ownerId: string,
    filters: StudioVideoFilters,
  ): Promise<VideoEntity[]> {
    const where: FindOptionsWhere<VideoOrmEntity> = {
      ownerId,
      deletionStatus: VideoDeletionStatus.ACTIVE,
    };

    if (filters.statuses && filters.statuses.length > 0) {
      where.status = In(filters.statuses as VideoStatus[]);
    }

    if (filters.visibilities && filters.visibilities.length > 0) {
      where.visibility = In(filters.visibilities as VideoVisibility[]);
    }

    const rows = await this.ormRepository.find({
      where,
      relations: { category: true, videoTags: { tag: true } },
      order: {
        updatedAt: 'DESC',
        createdAt: 'DESC',
      },
      take: filters.limit,
    });

    return rows.map((row) => this.toDomain(row));
  }

  async findPublicByChannelId(channelId: string): Promise<VideoEntity[]> {
    const rows = await this.ormRepository
      .createQueryBuilder('video')
      .leftJoinAndSelect('video.category', 'category')
      .leftJoinAndSelect('video.videoTags', 'videoTag')
      .leftJoinAndSelect('videoTag.tag', 'tag')
      .where('video.channelId = :channelId', { channelId })
      .andWhere('video.status = :status', { status: VideoStatus.READY })
      .andWhere('video.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('video.visibility = :visibility', {
        visibility: VideoVisibility.PUBLIC,
      })
      .orderBy('video.publishedAt', 'DESC')
      .addOrderBy('video.createdAt', 'DESC')
      .getMany();

    return rows.map((row) => this.toDomain(row));
  }

  async findLatestPublic(limit: number): Promise<VideoEntity[]> {
    const rows = await this.ormRepository
      .createQueryBuilder('video')
      .leftJoinAndSelect('video.category', 'category')
      .leftJoinAndSelect('video.videoTags', 'videoTag')
      .leftJoinAndSelect('videoTag.tag', 'tag')
      .where('video.status = :status', { status: VideoStatus.READY })
      .andWhere('video.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('video.visibility = :visibility', {
        visibility: VideoVisibility.PUBLIC,
      })
      .orderBy('video.publishedAt', 'DESC')
      .addOrderBy('video.createdAt', 'DESC')
      .take(limit)
      .getMany();

    return rows.map((row) => this.toDomain(row));
  }

  async findByCategory(
    category: string,
    limit: number,
  ): Promise<VideoEntity[]> {
    return this.searchPublic({ category, limit });
  }

  async findByCategoryPaged(
    filters: PublicVideosByCategoryPageFilters,
  ): Promise<PublicVideosByCategoryPageResult> {
    const offset = (filters.page - 1) * filters.limit;
    const queryBuilder = this.ormRepository
      .createQueryBuilder('video')
      .leftJoinAndSelect('video.category', 'category')
      .leftJoinAndSelect('video.videoTags', 'videoTag')
      .leftJoinAndSelect('videoTag.tag', 'tag')
      .where('video.status = :status', { status: VideoStatus.READY })
      .andWhere('video.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('video.visibility = :visibility', {
        visibility: VideoVisibility.PUBLIC,
      })
      .andWhere('category.slug = :category', {
        category: filters.category,
      })
      .orderBy('video.publishedAt', 'DESC')
      .addOrderBy('video.createdAt', 'DESC')
      .skip(offset)
      .take(filters.limit);

    const [rows, total] = await queryBuilder.getManyAndCount();

    return {
      items: rows.map((row) => this.toDomain(row)),
      total,
    };
  }

  async searchPublic(
    filters: PublicVideoSearchFilters,
  ): Promise<VideoEntity[]> {
    const queryBuilder = this.ormRepository
      .createQueryBuilder('video')
      .leftJoinAndSelect('video.category', 'category')
      .leftJoinAndSelect('video.videoTags', 'videoTag')
      .leftJoinAndSelect('videoTag.tag', 'tag')
      .where('video.status = :status', { status: VideoStatus.READY })
      .andWhere('video.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('video.visibility = :visibility', {
        visibility: VideoVisibility.PUBLIC,
      });

    if (filters.category) {
      queryBuilder.andWhere('category.slug = :category', {
        category: filters.category,
      });
    }

    if (filters.tags && filters.tags.length > 0) {
      queryBuilder.andWhere(
        `video.id IN (
          SELECT filtered_video_tags.video_id
          FROM video_tags filtered_video_tags
          INNER JOIN tags filtered_tags ON filtered_tags.id = filtered_video_tags.tag_id
          WHERE filtered_tags.slug IN (:...tags)
          GROUP BY filtered_video_tags.video_id
          HAVING COUNT(DISTINCT filtered_tags.slug) = :tagCount
        )`,
        { tags: filters.tags, tagCount: filters.tags.length },
      );
    }

    const normalizedQuery = filters.q?.trim().toLowerCase();
    if (normalizedQuery) {
      const exact = normalizedQuery;
      const prefix = `${escapeLikePattern(normalizedQuery)}%`;
      const partial = `%${escapeLikePattern(normalizedQuery)}%`;

      queryBuilder
        .andWhere(
          `(
            LOWER(video.title) LIKE :partial ESCAPE '\\'
            OR LOWER(video.description) LIKE :partial ESCAPE '\\'
          )`,
          { partial },
        )
        .addSelect(
          `CASE
            WHEN LOWER(video.title) = :exact THEN 400
            WHEN LOWER(video.title) LIKE :prefix ESCAPE '\\' THEN 300
            WHEN LOWER(video.title) LIKE :partial ESCAPE '\\' THEN 200
            WHEN LOWER(video.description) LIKE :partial ESCAPE '\\' THEN 100
            ELSE 0
          END`,
          'search_rank',
        )
        .setParameters({
          exact,
          prefix,
          partial,
        });

      queryBuilder.orderBy('search_rank', 'DESC');
      queryBuilder.addOrderBy('video.publishedAt', 'DESC');
    } else {
      queryBuilder.orderBy('video.publishedAt', 'DESC');
    }

    const searchRows = await queryBuilder
      .addOrderBy('video.createdAt', 'DESC')
      .take(filters.limit)
      .getMany();

    return searchRows.map((row) => this.toDomain(row));
  }

  async findByChannelIds(
    channelIds: string[],
    limit: number,
  ): Promise<VideoEntity[]> {
    if (channelIds.length === 0) {
      return [];
    }

    const rows = await this.ormRepository.find({
      where: {
        channelId: In(channelIds),
        status: VideoStatus.READY,
        isDeleted: false,
        visibility: VideoVisibility.PUBLIC,
      },
      relations: { category: true, videoTags: { tag: true } },
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
      take: limit,
    });
    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: VideoOrmEntity): VideoEntity {
    const legacyVideoCategories =
      (
        row as VideoOrmEntity & {
          videoCategories?: { category: typeof row.category }[];
        }
      ).videoCategories ?? [];
    const category = row.category ?? legacyVideoCategories[0]?.category;

    if (!category) {
      throw new Error(`Video ${row.id} is missing category relation`);
    }

    return new VideoEntity({
      id: row.id,
      channelId: row.channelId,
      ownerId: row.ownerId,
      title: row.title,
      description: row.description,
      category: new Category({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        parentId: category.parentId ?? null,
        status: category.status,
        displayOrder: category.displayOrder ?? 0,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      }),
      tags: (row.videoTags ?? []).map(
        (item) =>
          new Tag({
            id: item.tag.id,
            name: item.tag.name,
            slug: item.tag.slug,
            status: item.tag.status,
            createdAt: item.tag.createdAt,
            updatedAt: item.tag.updatedAt,
          }),
      ),
      visibility: row.visibility,
      status: row.status,
      price: row.price,
      requiredTierLevel: row.requiredTierLevel,
      rawFileKey: row.rawFileKey,
      masterPlaylistKey: row.masterPlaylistKey,
      thumbnailUrl: row.thumbnailUrl,
      durationSeconds: row.durationSeconds,
      resolutions: row.resolutions.filter((value) => value.length > 0),
      errorMessage: row.errorMessage,
      moderationDetails: toModerationDetails(row.moderationDetails),
      viewCount: row.viewCount,
      publishedAt: row.publishedAt,
      isDeleted: row.isDeleted ?? false,
      deletedAt: row.deletedAt ?? null,
      deletedBy: row.deletedBy ?? null,
      deleteReason: row.deleteReason ?? null,
      deletionStatus:
        row.deletionStatus ??
        (row.isDeleted
          ? VideoDeletionStatus.PENDING_DELETE
          : VideoDeletionStatus.ACTIVE),
      deleteRequestedAt: row.deleteRequestedAt ?? row.deletedAt ?? null,
      refundCompletedAt: row.refundCompletedAt ?? null,
      refundSummary: row.refundSummary ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      statusChangedAt: row.statusChangedAt,
    });
  }
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

function toModerationDetails(
  value: Record<string, unknown> | null,
): VideoModerationDetails | null {
  if (!value) {
    return null;
  }

  const reason = value.reason;
  const confidence = value.confidence;
  const evidenceTimestampSeconds = value.evidenceTimestampSeconds;

  if (typeof reason !== 'string' || typeof confidence !== 'number') {
    return null;
  }

  return {
    reason,
    confidence,
    evidenceTimestampSeconds:
      typeof evidenceTimestampSeconds === 'number'
        ? evidenceTimestampSeconds
        : null,
  };
}
