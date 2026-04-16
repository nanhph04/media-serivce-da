import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';

@Entity('videos')
@Index(['channelId', 'status'])
@Index(['category', 'status'])
export class VideoOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36, name: 'channel_id' })
  channelId!: string;

  @Column({ type: 'varchar', length: 36, name: 'owner_id' })
  ownerId!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @Column({ type: 'varchar', length: 100, default: 'general' })
  category!: string;

  @Column({
    type: 'enum',
    enum: VideoVisibility,
    default: VideoVisibility.PUBLIC,
  })
  visibility!: VideoVisibility;

  @Column({ type: 'enum', enum: VideoStatus, default: VideoStatus.DRAFT })
  status!: VideoStatus;

  @Column({ type: 'int', default: 0 })
  price!: number;

  @Column({ type: 'int', name: 'required_tier_level', nullable: true })
  requiredTierLevel!: number | null;

  @Column({ type: 'varchar', length: 500, name: 'raw_file_key' })
  rawFileKey!: string;

  @Column({
    type: 'varchar',
    length: 500,
    name: 'master_playlist_key',
    nullable: true,
  })
  masterPlaylistKey!: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    name: 'thumbnail_url',
    nullable: true,
  })
  thumbnailUrl!: string | null;

  @Column({ type: 'int', name: 'duration_seconds', nullable: true })
  durationSeconds!: number | null;

  @Column({ type: 'simple-array', default: '' })
  resolutions!: string[];

  @Column({ type: 'text', name: 'error_message', nullable: true })
  errorMessage!: string | null;

  @Column({ type: 'int', name: 'view_count', default: 0 })
  viewCount!: number;

  @Column({ type: 'timestamp', name: 'published_at', nullable: true })
  publishedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
