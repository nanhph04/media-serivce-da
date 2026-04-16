import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('membership_tiers')
export class MembershipTierOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36, name: 'channel_id' })
  channelId!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'int' })
  level!: number;

  @Column({ type: 'int', name: 'price_coin' })
  priceCoin!: number;

  @Column({ type: 'boolean', name: 'is_accepting_new', default: true })
  isAcceptingNew!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
