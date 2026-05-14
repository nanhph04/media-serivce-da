import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type SelectQueryBuilder } from 'typeorm';
import {
  VideoDeletionStatus,
  VideoStatus,
} from '../../domain/entities/video.entity';
import { ChannelOrmEntity } from '../../../channels/infrastructure/persistence/channel.orm-entity';
import { VideoPurchaseUnlockEntity } from '../../domain/entities/video-purchase-unlock.entity';
import type {
  IVideoPurchaseUnlockRepository,
  PurchasedVideoItemReadModel,
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

    const purchasedAtByVideoId = new Map(
      idRows.map((row) => [row.videoId, new Date(row.lastUnlockedAt)]),
    );

    const rows = await this.ormRepository.manager
      .createQueryBuilder(VideoOrmEntity, 'video')
      .leftJoinAndSelect('video.category', 'category')
      .leftJoinAndSelect('video.videoTags', 'videoTag')
      .leftJoinAndSelect('videoTag.tag', 'tag')
      .leftJoin(ChannelOrmEntity, 'channel', 'channel.id = video.channel_id')
      .addSelect('channel.name', 'channelName')
      .where('video.id IN (:...videoIds)', { videoIds })
      .getRawAndEntities();

    const channelNameByVideoId = new Map(
      rows.raw.map((row: { video_id: string; channelName: string | null }) => [
        row.video_id,
        row.channelName,
      ]),
    );
    const rowsById = new Map(rows.entities.map((row) => [row.id, row]));

    return {
      items: videoIds
        .map((videoId) => {
          const row = rowsById.get(videoId);
          const purchasedAt = purchasedAtByVideoId.get(videoId);

          if (!row || !purchasedAt) {
            return null;
          }

          return this.toPurchasedVideoItem(row, {
            purchasedAt,
            channelName: channelNameByVideoId.get(videoId) ?? null,
          });
        })
        .filter(
          (item): item is PurchasedVideoItemReadModel => item !== null,
        ),
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
      .andWhere('video.deletion_status = :deletionStatus', {
        deletionStatus: VideoDeletionStatus.ACTIVE,
      })
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

  private toPurchasedVideoItem(
    row: VideoOrmEntity,
    metadata: {
      purchasedAt: Date;
      channelName: string | null;
    },
  ): PurchasedVideoItemReadModel {
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

    return {
      videoId: row.id,
      channelId: row.channelId,
      channelName: metadata.channelName,
      title: row.title,
      description: row.description,
      thumbnailUrl: row.thumbnailUrl,
      durationSeconds: row.durationSeconds,
      categories: [category.slug],
      tags: (row.videoTags ?? []).map((item) => item.tag.slug),
      priceCoin: row.price,
      purchasedAt: metadata.purchasedAt,
      publishedAt: row.publishedAt,
      viewCount: row.viewCount,
      accessStatus: 'ACTIVE',
    };
  }
}
