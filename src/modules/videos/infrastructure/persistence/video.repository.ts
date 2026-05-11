import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, type FindOptionsWhere } from 'typeorm';
import {
  VideoEntity,
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { Category } from '../../../categories/domain/entities/category.entity';
import type {
  PublicVideoSearchFilters,
  PublicVideosByCategoryPageFilters,
  PublicVideosByCategoryPageResult,
  IVideoRepository,
  StudioVideoFilters,
} from '../../domain/repositories/video.repository';
import { VideoCategoryOrmEntity } from './video-category.orm-entity';
import { VideoOrmEntity } from './video.orm-entity';

@Injectable()
export class VideoRepository implements IVideoRepository {
  constructor(
    @InjectRepository(VideoOrmEntity)
    private readonly ormRepository: Repository<VideoOrmEntity>,
  ) {}

  async save(video: VideoEntity): Promise<void> {
    await this.ormRepository.save({
      id: video.id,
      channelId: video.channelId,
      ownerId: video.ownerId,
      title: video.title,
      description: video.description,
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
      viewCount: video.viewCount,
      publishedAt: video.publishedAt,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
      videoCategories: video.category.map(
        (category): VideoCategoryOrmEntity => ({
          videoId: video.id,
          categoryId: category.id,
          video: undefined as never,
          category: {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            status: category.status,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
          },
        }),
      ),
    });
  }

  async findById(id: string): Promise<VideoEntity | null> {
    const row = await this.ormRepository
      .createQueryBuilder('video')
      .leftJoinAndSelect('video.videoCategories', 'videoCategory')
      .leftJoinAndSelect('videoCategory.category', 'category')
      .where('video.id = :id', { id })
      .getOne();

    return row ? this.toDomain(row) : null;
  }

  async findBasicById(id: string): Promise<VideoEntity | null> {
    const row = await this.ormRepository.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
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
    const where: FindOptionsWhere<VideoOrmEntity> = { ownerId };

    if (filters.statuses && filters.statuses.length > 0) {
      where.status = In(filters.statuses as VideoStatus[]);
    }

    if (filters.visibilities && filters.visibilities.length > 0) {
      where.visibility = In(filters.visibilities as VideoVisibility[]);
    }

    const rows = await this.ormRepository.find({
      where,
      relations: {
        videoCategories: {
          category: true,
        },
      },
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
      .leftJoinAndSelect('video.videoCategories', 'videoCategory')
      .leftJoinAndSelect('videoCategory.category', 'category')
      .where('video.channelId = :channelId', { channelId })
      .andWhere('video.status = :status', { status: VideoStatus.READY })
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
      .leftJoinAndSelect('video.videoCategories', 'videoCategory')
      .leftJoinAndSelect('videoCategory.category', 'category')
      .where('video.status = :status', { status: VideoStatus.READY })
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
      .leftJoinAndSelect('video.videoCategories', 'videoCategory')
      .leftJoinAndSelect('videoCategory.category', 'category')
      .where('video.status = :status', { status: VideoStatus.READY })
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
      .leftJoinAndSelect('video.videoCategories', 'videoCategory')
      .leftJoinAndSelect('videoCategory.category', 'category')
      .where('video.status = :status', { status: VideoStatus.READY })
      .andWhere('video.visibility = :visibility', {
        visibility: VideoVisibility.PUBLIC,
      });

    if (filters.category) {
      queryBuilder.andWhere('category.slug = :category', {
        category: filters.category,
      });
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
        visibility: VideoVisibility.PUBLIC,
      },
      relations: {
        videoCategories: {
          category: true,
        },
      },
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
      take: limit,
    });
    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: VideoOrmEntity): VideoEntity {
    const videoCategories = row.videoCategories ?? [];

    return new VideoEntity({
      id: row.id,
      channelId: row.channelId,
      ownerId: row.ownerId,
      title: row.title,
      description: row.description,
      category: videoCategories.map(
        (item) =>
          new Category({
            id: item.category.id,
            name: item.category.name,
            slug: item.category.slug,
            description: item.category.description,
            status: item.category.status,
            createdAt: item.category.createdAt,
            updatedAt: item.category.updatedAt,
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
      viewCount: row.viewCount,
      publishedAt: row.publishedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}
