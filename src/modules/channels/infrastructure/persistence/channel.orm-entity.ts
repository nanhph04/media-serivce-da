import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import {
  ChannelStatus,
  MembershipReviewStatus,
} from '../../domain/entities/channel.entity';

@Entity('channels')
@Index(['userId'], { unique: true })
export class ChannelOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36, name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text' })
  bio!: string;

  @Column({ type: 'varchar', length: 500, name: 'avatar_url' })
  avatarUrl!: string;

  @Column({ type: 'varchar', length: 500, name: 'banner_url' })
  bannerUrl!: string;

  @Column({
    type: 'varchar',
    length: 500,
    name: 'avatar_object_key',
    nullable: true,
  })
  avatarObjectKey!: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    name: 'banner_object_key',
    nullable: true,
  })
  bannerObjectKey!: string | null;

  @Column({ type: 'enum', enum: ChannelStatus })
  status!: ChannelStatus;

  @Column({ name: 'is_eligible_for_membership', default: false })
  isEligibleForMembership!: boolean;

  @Column({ name: 'is_membership_closed_by_admin', default: false })
  isMembershipClosedByAdmin!: boolean;

  @Column({
    type: 'enum',
    enum: MembershipReviewStatus,
    name: 'membership_review_status',
    default: MembershipReviewStatus.NOT_REQUESTED,
  })
  membershipReviewStatus!: MembershipReviewStatus;

  @Column({ type: 'text', name: 'membership_rejection_reason', nullable: true })
  membershipRejectionReason!: string | null;

  @Column({
    type: 'varchar',
    length: 36,
    name: 'membership_reviewed_by',
    nullable: true,
  })
  membershipReviewedBy!: string | null;

  @Column({ type: 'timestamp', name: 'membership_reviewed_at', nullable: true })
  membershipReviewedAt!: Date | null;

  @Column({
    type: 'timestamp',
    name: 'membership_requested_at',
    nullable: true,
  })
  membershipRequestedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
