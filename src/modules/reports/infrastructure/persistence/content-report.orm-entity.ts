import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  ContentReportStatus,
  ContentReportTargetType,
} from '../../domain/entities/content-report.entity';

@Entity('content_reports')
@Index(['status', 'createdAt'])
@Index(['targetType', 'targetVideoId'])
@Index(['targetType', 'targetChannelId'])
@Index(['reporterUserId'])
export class ContentReportOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({
    type: 'enum',
    enum: ContentReportTargetType,
    name: 'target_type',
  })
  targetType!: ContentReportTargetType;

  @Column({ type: 'varchar', length: 36, name: 'reporter_user_id' })
  reporterUserId!: string;

  @Column({
    type: 'varchar',
    length: 36,
    name: 'target_video_id',
    nullable: true,
  })
  targetVideoId!: string | null;

  @Column({ type: 'varchar', length: 36, name: 'target_channel_id' })
  targetChannelId!: string;

  @Column({ type: 'text' })
  reason!: string;

  @Column({
    type: 'int',
    name: 'evidence_timestamp_seconds',
    nullable: true,
  })
  evidenceTimestampSeconds!: number | null;

  @Column({
    type: 'varchar',
    length: 36,
    name: 'context_video_id',
    nullable: true,
  })
  contextVideoId!: string | null;

  @Column({
    type: 'varchar',
    length: 200,
    name: 'context_video_title',
    nullable: true,
  })
  contextVideoTitle!: string | null;

  @Column({
    type: 'enum',
    enum: ContentReportStatus,
    default: ContentReportStatus.PENDING,
  })
  status!: ContentReportStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
