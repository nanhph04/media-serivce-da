import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ChannelMembershipStatus } from '../../domain/entities/channel-membership.entity';
import { ChannelMembershipRenewalStatus } from '../../domain/entities/channel-membership.entity';

@Entity('channel_memberships')
@Index(['userId', 'channelId'], { unique: true })
export class ChannelMembershipOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36, name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', length: 36, name: 'channel_id' })
  channelId!: string;

  @Column({ type: 'varchar', length: 36, name: 'membership_id' })
  membershipId!: string;

  @Column({ type: 'timestamp', name: 'expiry_date', nullable: true })
  expiryDate!: Date | null;

  @Column({ type: 'int', name: 'retry_count', default: 0 })
  retryCount!: number;

  @Column({ type: 'enum', enum: ChannelMembershipStatus })
  status!: ChannelMembershipStatus;

  @Column({ type: 'boolean', name: 'auto_renew_enabled', default: true })
  autoRenewEnabled!: boolean;

  @Column({
    type: 'enum',
    enum: ChannelMembershipRenewalStatus,
    name: 'renewal_status',
    default: ChannelMembershipRenewalStatus.IDLE,
  })
  renewalStatus!: ChannelMembershipRenewalStatus;

  @Column({
    type: 'timestamp',
    name: 'renewal_reminder_sent_at',
    nullable: true,
  })
  renewalReminderSentAt!: Date | null;

  @Column({
    type: 'timestamp',
    name: 'last_renewal_attempt_at',
    nullable: true,
  })
  lastRenewalAttemptAt!: Date | null;

  @Column({
    type: 'timestamp',
    name: 'next_renewal_attempt_at',
    nullable: true,
  })
  nextRenewalAttemptAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
