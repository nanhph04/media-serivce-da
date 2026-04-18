import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  VideoEntity,
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { Category } from '../../../categories/domain/entities/category.entity';
import type { IVideoRepository } from '../../domain/repositories/video.repository';
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
    const row = await this.ormRepository.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findPublicByChannelId(channelId: string): Promise<VideoEntity[]> {
    const rows = await this.ormRepository.find({
      where: {
        channelId,
        status: VideoStatus.PUBLIC,
        visibility: VideoVisibility.PUBLIC,
      },
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findLatestPublic(limit: number): Promise<VideoEntity[]> {
    const rows = await this.ormRepository.find({
      where: {
        status: VideoStatus.PUBLIC,
        visibility: VideoVisibility.PUBLIC,
      },
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
      take: limit,
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findByCategory(
    category: string,
    limit: number,
  ): Promise<VideoEntity[]> {
    const rows = await this.ormRepository
      .createQueryBuilder('video')
      .leftJoinAndSelect('video.videoCategories', 'videoCategory')
      .leftJoinAndSelect('videoCategory.category', 'category')
      .where('video.status = :status', { status: VideoStatus.PUBLIC })
      .andWhere('video.visibility = :visibility', {
        visibility: VideoVisibility.PUBLIC,
      })
      .andWhere('category.slug = :category', { category })
      .orderBy('video.publishedAt', 'DESC')
      .addOrderBy('video.createdAt', 'DESC')
      .take(limit)
      .getMany();
    return rows.map((row) => this.toDomain(row));
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
        status: VideoStatus.PUBLIC,
        visibility: VideoVisibility.PUBLIC,
      },
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
      take: limit,
    });
    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: VideoOrmEntity): VideoEntity {
    return new VideoEntity({
      id: row.id,
      channelId: row.channelId,
      ownerId: row.ownerId,
      title: row.title,
      description: row.description,
      category: row.videoCategories.map(
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
