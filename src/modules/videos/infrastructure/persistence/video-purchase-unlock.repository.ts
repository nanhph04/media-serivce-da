import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type SelectQueryBuilder } from 'typeorm';
import { Category } from '../../../categories/domain/entities/category.entity';
import { Tag } from '../../../tags/domain/entities/tag.entity';
import { VideoEntity, VideoStatus } from '../../domain/entities/video.entity';
import { VideoPurchaseUnlockEntity } from '../../domain/entities/video-purchase-unlock.entity';
import type {
  IVideoPurchaseUnlockRepository,
  PurchasedVideosPageFilters,
  PurchasedVideosPageResult,
} from '../../domain/repositories/video-purchase-unlock.repository';
import { VideoPurchaseUnlockOrmEntity } from './video-purchase-unlock.orm-entity';
import { VideoOrmEntity } from './video.orm-entity';

@Injectable()
export class VideoPurchaseUnlockRepository implements IVideoPurchaseUnlockRepository {
  constructor(
    @InjectRepository(VideoPurchaseUnlockOrmEntity)
    private readonly ormRepository: Repository<VideoPurchaseUnlockOrmEntity>,
  ) {}

  async save(unlock: VideoPurchaseUnlockEntity): Promise<void> {
    await this.ormRepository.save({
      id: unlock.id,
      videoId: unlock.videoId,
      userId: unlock.userId,
      createdAt: unlock.createdAt,
      updatedAt: unlock.updatedAt,
    });
  }

  async exists(videoId: string, userId: string): Promise<boolean> {
    return (
      (await this.ormRepository.count({
        where: { videoId, userId },
      })) > 0
    );
  }

  async findPurchasedByUserId(
    filters: PurchasedVideosPageFilters,
  ): Promise<PurchasedVideosPageResult> {
    const offset = (filters.page - 1) * filters.limit;

    const baseQueryBuilder = this.createPurchasedVideosBaseQueryBuilder(
      filters.userId,
    );

    const [idRows, total] = await Promise.all([
      baseQueryBuilder
        .clone()
        .select('video.id', 'videoId')
        .addSelect('MAX(unlock.created_at)', 'lastUnlockedAt')
        .groupBy('video.id')
        .addGroupBy('video.created_at')
        .orderBy('MAX(unlock.created_at)', 'DESC')
        .addOrderBy('video.created_at', 'DESC')
        .offset(offset)
        .limit(filters.limit)
        .getRawMany<{ videoId: string; lastUnlockedAt: Date }>(),

      this.countPurchasedByUserId(baseQueryBuilder),
    ]);

    const videoIds = idRows.map((row) => row.videoId);

    if (videoIds.length === 0) {
      return {
        items: [],
        total,
      };
    }

    const rows = await this.ormRepository.manager
      .createQueryBuilder(VideoOrmEntity, 'video')
      .leftJoinAndSelect('video.category', 'category')
      .leftJoinAndSelect('video.videoTags', 'videoTag')
      .leftJoinAndSelect('videoTag.tag', 'tag')
      .where('video.id IN (:...videoIds)', { videoIds })
      .getMany();

    const rowsById = new Map(rows.map((row) => [row.id, row]));

    return {
      items: videoIds
        .map((videoId) => rowsById.get(videoId))
        .filter((row): row is VideoOrmEntity => row !== undefined)
        .map((row) => this.toVideoDomain(row)),
      total,
    };
  }

  private createPurchasedVideosBaseQueryBuilder(
    userId: string,
  ): SelectQueryBuilder<VideoPurchaseUnlockOrmEntity> {
    return this.ormRepository.manager
      .createQueryBuilder(VideoPurchaseUnlockOrmEntity, 'unlock')
      .innerJoin(VideoOrmEntity, 'video', 'video.id = unlock.video_id')
      .where('unlock.user_id = :userId', { userId })
      .andWhere('video.status = :status', { status: VideoStatus.READY })
      .andWhere('video.price > 0');
  }

  private async countPurchasedByUserId(
    baseQueryBuilder: SelectQueryBuilder<VideoPurchaseUnlockOrmEntity>,
  ): Promise<number> {
    const raw = await baseQueryBuilder
      .clone()
      .orderBy()
      .select('COUNT(DISTINCT video.id)', 'total')
      .getRawOne<{ total: string }>();

    return Number(raw?.total ?? 0);
  }

  private toVideoDomain(row: VideoOrmEntity): VideoEntity {
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
      viewCount: row.viewCount,
      publishedAt: row.publishedAt,
      isDeleted: row.isDeleted ?? false,
      deletedAt: row.deletedAt ?? null,
      deletedBy: row.deletedBy ?? null,
      deleteReason: row.deleteReason ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
