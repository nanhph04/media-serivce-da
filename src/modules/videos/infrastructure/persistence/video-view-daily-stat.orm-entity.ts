import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('video_view_daily_stats')
@Index('IDX_video_view_daily_stats_stat_date_view_count', [
  'statDate',
  'viewCount',
])
export class VideoViewDailyStatOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36, name: 'video_id' })
  videoId!: string;

  @PrimaryColumn({ type: 'date', name: 'stat_date' })
  statDate!: string;

  @Column({ type: 'int', name: 'view_count', default: 0 })
  viewCount!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
