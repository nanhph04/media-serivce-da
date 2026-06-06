import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  VideoDeletionStatus,
  VideoStatus,
  VideoThumbnailSource,
  VideoThumbnailStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { CategoryOrmEntity } from '../../../categories/infrastructure/persistence/category.orm-entity';
import { VideoTagOrmEntity } from './video-tag.orm-entity';

@Entity('videos')
@Index(['channelId', 'status'])
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

  @Column({ type: 'varchar', length: 36, name: 'category_id', nullable: true })
  categoryId!: string | null;

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
    name: 'thumbnail_object_key',
    nullable: true,
  })
  thumbnailObjectKey!: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    name: 'thumbnail_url',
    nullable: true,
  })
  thumbnailUrl!: string | null;

  @Column({
    type: 'varchar',
    length: 16,
    name: 'thumbnail_source',
    default: VideoThumbnailSource.AUTO,
  })
  thumbnailSource!: VideoThumbnailSource;

  @Column({
    type: 'varchar',
    length: 16,
    name: 'thumbnail_status',
    default: VideoThumbnailStatus.PENDING,
  })
  thumbnailStatus!: VideoThumbnailStatus;

  @Column({ type: 'timestamp', name: 'thumbnail_generated_at', nullable: true })
  thumbnailGeneratedAt!: Date | null;

  @Column({ type: 'text', name: 'thumbnail_error', nullable: true })
  thumbnailError!: string | null;

  @Column({ type: 'int', name: 'duration_seconds', nullable: true })
  durationSeconds!: number | null;

  @Column({ type: 'simple-array', default: '' })
  resolutions!: string[];

  @Column({
    type: 'jsonb',
    name: 'processing_warnings',
    default: () => "'[]'::jsonb",
  })
  processingWarnings!: string[];

  @Column({ type: 'text', name: 'error_message', nullable: true })
  errorMessage!: string | null;

  @Column({ type: 'jsonb', name: 'moderation_details', nullable: true })
  moderationDetails!: Record<string, unknown> | null;

  @Column({ type: 'int', name: 'view_count', default: 0 })
  viewCount!: number;

  @Column({ type: 'timestamptz', name: 'published_at', nullable: true })
  publishedAt!: Date | null;

  @Column({ type: 'boolean', name: 'is_deleted', default: false })
  isDeleted!: boolean;

  @Column({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;

  @Column({ type: 'varchar', length: 36, name: 'deleted_by', nullable: true })
  deletedBy!: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'delete_reason',
    nullable: true,
  })
  deleteReason!: string | null;

  @Column({
    type: 'varchar',
    length: 32,
    name: 'deletion_status',
    default: VideoDeletionStatus.ACTIVE,
  })
  deletionStatus!: VideoDeletionStatus;

  @Column({ type: 'timestamptz', name: 'delete_requested_at', nullable: true })
  deleteRequestedAt!: Date | null;

  @Column({ type: 'timestamptz', name: 'refund_completed_at', nullable: true })
  refundCompletedAt!: Date | null;

  @Column({ type: 'jsonb', name: 'refund_summary', nullable: true })
  refundSummary!: Record<string, unknown> | null;

  @Column({ type: 'timestamptz', name: 'storage_deleted_at', nullable: true })
  storageDeletedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @Column({
    type: 'timestamptz',
    name: 'status_changed_at',
    default: () => 'now()',
  })
  statusChangedAt!: Date;

  @ManyToOne(() => CategoryOrmEntity, { eager: true, nullable: true })
  @JoinColumn({ name: 'category_id' })
  category!: CategoryOrmEntity | null;

  @OneToMany(() => VideoTagOrmEntity, (videoTag) => videoTag.video, {
    cascade: true,
  })
  videoTags!: VideoTagOrmEntity[];
}
