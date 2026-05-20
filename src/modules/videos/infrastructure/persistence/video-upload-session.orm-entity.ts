import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VideoUploadSessionStatus } from '../../domain/repositories/video-upload-session.repository';
import { VideoUploadPartOrmEntity } from './video-upload-part.orm-entity';

@Entity('video_upload_sessions')
@Index(['videoId', 'uploadId'], { unique: true })
@Index(['status', 'expiresAt'])
export class VideoUploadSessionOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36, name: 'video_id' })
  videoId!: string;

  @Column({ type: 'varchar', length: 36, name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', length: 500, name: 'raw_file_key' })
  rawFileKey!: string;

  @Column({ type: 'varchar', length: 512, name: 'upload_id' })
  uploadId!: string;

  @Column({ type: 'int', name: 'part_size_bytes' })
  partSizeBytes!: number;

  @Column({ type: 'varchar', length: 255, name: 'file_name' })
  fileName!: string;

  @Column({ type: 'bigint', name: 'file_size' })
  fileSize!: string;

  @Column({ type: 'timestamp', name: 'file_last_modified' })
  fileLastModified!: Date;

  @Column({
    type: 'varchar',
    length: 32,
    default: VideoUploadSessionStatus.ACTIVE,
  })
  status!: VideoUploadSessionStatus;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => VideoUploadPartOrmEntity, (part) => part.session, {
    cascade: true,
  })
  parts!: VideoUploadPartOrmEntity[];
}
