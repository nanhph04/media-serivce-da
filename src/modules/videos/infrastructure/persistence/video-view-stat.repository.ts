import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IVideoViewStatRepository } from '../../application/interfaces/video-view-stat.repository.interface';
import { VideoViewDailyStatOrmEntity } from './video-view-daily-stat.orm-entity';

@Injectable()
export class VideoViewStatRepository implements IVideoViewStatRepository {
  constructor(
    @InjectRepository(VideoViewDailyStatOrmEntity)
    private readonly ormRepository: Repository<VideoViewDailyStatOrmEntity>,
  ) {}

  async incrementDailyView(videoId: string, viewedAt: Date): Promise<void> {
    await this.ormRepository.query(
      `
        INSERT INTO "video_view_daily_stats" (
          "video_id",
          "stat_date",
          "view_count",
          "created_at",
          "updated_at"
        )
        VALUES ($1, $2, 1, now(), now())
        ON CONFLICT ("video_id", "stat_date")
        DO UPDATE SET
          "view_count" = "video_view_daily_stats"."view_count" + 1,
          "updated_at" = now()
      `,
      [videoId, this.toUtcDateString(viewedAt)],
    );
  }

  private toUtcDateString(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
