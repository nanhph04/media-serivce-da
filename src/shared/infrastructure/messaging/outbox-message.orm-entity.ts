import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum OutboxMessageStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PUBLISHED = 'published',
}

@Entity('outbox_messages')
@Index(['status', 'nextAttemptAt'])
export class OutboxMessageOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  topic!: string;

  @Column({ type: 'varchar', length: 255, name: 'message_key' })
  messageKey!: string;

  @Column({ type: 'jsonb' })
  payload!: unknown;

  @Column({
    type: 'enum',
    enum: OutboxMessageStatus,
    default: OutboxMessageStatus.PENDING,
  })
  status!: OutboxMessageStatus;

  @Column({ type: 'integer', name: 'attempt_count', default: 0 })
  attemptCount!: number;

  @Column({ type: 'timestamp', name: 'next_attempt_at' })
  nextAttemptAt!: Date;

  @Column({ type: 'timestamp', name: 'locked_at', nullable: true })
  lockedAt!: Date | null;

  @Column({ type: 'timestamp', name: 'published_at', nullable: true })
  publishedAt!: Date | null;

  @Column({ type: 'text', name: 'last_error', nullable: true })
  lastError!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
