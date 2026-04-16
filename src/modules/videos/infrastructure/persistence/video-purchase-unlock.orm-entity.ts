import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('video_purchase_unlocks')
@Index(['videoId', 'userId'], { unique: true })
export class VideoPurchaseUnlockOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36, name: 'video_id' })
  videoId!: string;

  @Column({ type: 'varchar', length: 36, name: 'user_id' })
  userId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
