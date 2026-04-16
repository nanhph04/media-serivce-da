import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ChannelStatus } from '../../domain/entities/channel.entity';

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

  @Column({ type: 'enum', enum: ChannelStatus })
  status!: ChannelStatus;

  @Column({ name: 'is_eligible_for_membership', default: false })
  isEligibleForMembership!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
