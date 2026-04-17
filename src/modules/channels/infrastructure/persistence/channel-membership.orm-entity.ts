import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ChannelMembershipStatus } from '../../domain/entities/channel-membership.entity';

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
