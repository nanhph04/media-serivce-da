import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { VideoProcessingJobPayload } from '@shared/application/interfaces/video-processing-job-dispatcher.interface';

export enum VideoProcessingDispatchStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  DISPATCHED = 'dispatched',
}

@Entity('video_processing_dispatches')
@Index(['status', 'nextAttemptAt'])
@Index(['jobId'], { unique: true })
export class VideoProcessingDispatchOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36, name: 'video_id' })
  videoId!: string;

  @Column({ type: 'varchar', length: 255, name: 'job_id' })
  jobId!: string;

  @Column({ type: 'jsonb' })
  payload!: VideoProcessingJobPayload;

  @Column({
    type: 'enum',
    enum: VideoProcessingDispatchStatus,
    default: VideoProcessingDispatchStatus.PENDING,
  })
  status!: VideoProcessingDispatchStatus;

  @Column({ type: 'integer', name: 'attempt_count', default: 0 })
  attemptCount!: number;

  @Column({ type: 'timestamptz', name: 'next_attempt_at' })
  nextAttemptAt!: Date;

  @Column({ type: 'timestamptz', name: 'locked_at', nullable: true })
  lockedAt!: Date | null;

  @Column({ type: 'timestamptz', name: 'dispatched_at', nullable: true })
  dispatchedAt!: Date | null;

  @Column({ type: 'text', name: 'last_error', nullable: true })
  lastError!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
