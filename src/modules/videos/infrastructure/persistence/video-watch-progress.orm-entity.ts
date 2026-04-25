import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VideoOrmEntity } from './video.orm-entity';

@Entity('video_watch_progress')
@Index(['userId', 'videoId'], { unique: true })
@Index(['userId', 'lastWatchedAt'])
@Index(['videoId'])
export class VideoWatchProgressOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36, name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', length: 36, name: 'video_id' })
  videoId!: string;

  @Column({ type: 'varchar', length: 36, name: 'channel_id' })
  channelId!: string;

  @Column({ type: 'int', name: 'last_position_seconds', default: 0 })
  lastPositionSeconds!: number;

  @Column({ type: 'int', name: 'duration_seconds', nullable: true })
  durationSeconds!: number | null;

  @Column({
    type: 'timestamp',
    name: 'last_watched_at',
    default: () => 'now()',
  })
  lastWatchedAt!: Date;

  @Column({ type: 'timestamp', name: 'completed_at', nullable: true })
  completedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => VideoOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'video_id' })
  video!: VideoOrmEntity;
}
