import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { VideoUploadSessionOrmEntity } from './video-upload-session.orm-entity';

@Entity('video_upload_parts')
@Index(['sessionId', 'partNumber'], { unique: true })
export class VideoUploadPartOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36, name: 'session_id' })
  sessionId!: string;

  @Column({ type: 'int', name: 'part_number' })
  partNumber!: number;

  @Column({ type: 'varchar', length: 255 })
  etag!: string;

  @Column({ type: 'bigint', name: 'size_bytes' })
  sizeBytes!: string;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt!: Date;

  @ManyToOne(() => VideoUploadSessionOrmEntity, (session) => session.parts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session!: VideoUploadSessionOrmEntity;
}
