import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  VideoEntity,
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import type { IVideoRepository } from '../../domain/repositories/video.repository';
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
      category: video.category,
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
    const rows = await this.ormRepository.find({
      where: {
        category,
        status: VideoStatus.PUBLIC,
        visibility: VideoVisibility.PUBLIC,
      },
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
      take: limit,
    });
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
      category: row.category,
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
