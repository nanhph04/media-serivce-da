import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { TagOrmEntity } from '../../../tags/infrastructure/persistence/tag.orm-entity';
import { VideoOrmEntity } from './video.orm-entity';

@Entity('video_tags')
@Index(['videoId', 'tagId'], { unique: true })
export class VideoTagOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36, name: 'video_id' })
  videoId!: string;

  @PrimaryColumn({ type: 'varchar', length: 36, name: 'tag_id' })
  tagId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => VideoOrmEntity, (video) => video.videoTags, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'video_id' })
  video!: VideoOrmEntity;

  @ManyToOne(() => TagOrmEntity, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tag_id' })
  tag!: TagOrmEntity;
}
