import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoWatchProgressEntity } from '../../domain/entities/video-watch-progress.entity';
import type { IVideoWatchProgressRepository } from '../../domain/repositories/video-watch-progress.repository';
import { VideoWatchProgressOrmEntity } from './video-watch-progress.orm-entity';

@Injectable()
export class VideoWatchProgressRepository implements IVideoWatchProgressRepository {
  constructor(
    @InjectRepository(VideoWatchProgressOrmEntity)
    private readonly ormRepository: Repository<VideoWatchProgressOrmEntity>,
  ) {}

  async findByUserIdAndVideoId(
    userId: string,
    videoId: string,
  ): Promise<VideoWatchProgressEntity | null> {
    const row = await this.ormRepository.findOne({
      where: {
        userId,
        videoId,
      },
    });

    return row ? this.toDomain(row) : null;
  }

  async save(progress: VideoWatchProgressEntity): Promise<void> {
    await this.ormRepository
      .createQueryBuilder()
      .insert()
      .into(VideoWatchProgressOrmEntity)
      .values({
        id: progress.id,
        userId: progress.userId,
        videoId: progress.videoId,
        channelId: progress.channelId,
        lastPositionSeconds: progress.lastPositionSeconds,
        durationSeconds: progress.durationSeconds,
        lastWatchedAt: progress.lastWatchedAt,
        completedAt: progress.completedAt,
        createdAt: progress.createdAt,
        updatedAt: progress.updatedAt,
      })
      .orUpdate(
        [
          'channel_id',
          'last_position_seconds',
          'duration_seconds',
          'last_watched_at',
          'completed_at',
          'updated_at',
        ],
        ['user_id', 'video_id'],
      )
      .execute();
  }

  private toDomain(row: VideoWatchProgressOrmEntity): VideoWatchProgressEntity {
    return new VideoWatchProgressEntity({
      id: row.id,
      userId: row.userId,
      videoId: row.videoId,
      channelId: row.channelId,
      lastPositionSeconds: row.lastPositionSeconds,
      durationSeconds: row.durationSeconds,
      lastWatchedAt: row.lastWatchedAt,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
