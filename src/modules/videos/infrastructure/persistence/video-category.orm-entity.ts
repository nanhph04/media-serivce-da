import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { CategoryOrmEntity } from '../../../categories/infrastructure/persistence/category.orm-entity';
import { VideoOrmEntity } from './video.orm-entity';

@Entity('video_categories')
@Index(['videoId', 'categoryId'], { unique: true })
export class VideoCategoryOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36, name: 'video_id' })
  videoId!: string;

  @PrimaryColumn({ type: 'varchar', length: 36, name: 'category_id' })
  categoryId!: string;

  @ManyToOne(() => VideoOrmEntity, (video) => video.videoCategories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'video_id' })
  video!: VideoOrmEntity;

  @ManyToOne(() => CategoryOrmEntity, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category!: CategoryOrmEntity;
}
