import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import {
  type CreateVideoUploadSessionInput,
  type IVideoUploadSessionRepository,
  type VideoUploadSession,
  VideoUploadSessionStatus,
} from '../../domain/repositories/video-upload-session.repository';
import { VideoUploadPartOrmEntity } from './video-upload-part.orm-entity';
import { VideoUploadSessionOrmEntity } from './video-upload-session.orm-entity';

@Injectable()
export class VideoUploadSessionRepository implements IVideoUploadSessionRepository {
  constructor(
    @InjectRepository(VideoUploadSessionOrmEntity)
    private readonly sessionRepository: Repository<VideoUploadSessionOrmEntity>,
    @InjectRepository(VideoUploadPartOrmEntity)
    private readonly partRepository: Repository<VideoUploadPartOrmEntity>,
  ) {}

  async create(
    input: CreateVideoUploadSessionInput,
  ): Promise<VideoUploadSession> {
    const row = await this.sessionRepository.save({
      id: crypto.randomUUID(),
      videoId: input.videoId,
      userId: input.userId,
      rawFileKey: input.rawFileKey,
      uploadId: input.uploadId,
      partSizeBytes: input.partSizeBytes,
      fileName: input.fileName,
      fileSize: String(input.fileSize),
      fileLastModified: input.fileLastModified,
      status: VideoUploadSessionStatus.ACTIVE,
      expiresAt: input.expiresAt,
    });

    return this.toDomain({ ...row, parts: [] });
  }

  async findByVideoAndUploadId(
    videoId: string,
    uploadId: string,
  ): Promise<VideoUploadSession | null> {
    const row = await this.sessionRepository.findOne({
      where: { videoId, uploadId },
      relations: { parts: true },
      order: { parts: { partNumber: 'ASC' } },
    });

    return row ? this.toDomain(row) : null;
  }

  async findActiveByVideoId(
    videoId: string,
    now = new Date(),
  ): Promise<VideoUploadSession | null> {
    const row = await this.sessionRepository.findOne({
      where: {
        videoId,
        status: VideoUploadSessionStatus.ACTIVE,
        expiresAt: MoreThan(now),
      },
      relations: { parts: true },
      order: { createdAt: 'DESC', parts: { partNumber: 'ASC' } },
    });

    return row ? this.toDomain(row) : null;
  }

  async savePart(input: {
    sessionId: string;
    partNumber: number;
    etag: string;
    sizeBytes: number;
  }): Promise<void> {
    await this.partRepository.upsert(
      {
        sessionId: input.sessionId,
        partNumber: input.partNumber,
        etag: input.etag,
        sizeBytes: String(input.sizeBytes),
      },
      ['sessionId', 'partNumber'],
    );
  }

  async markCompleted(sessionId: string): Promise<void> {
    await this.sessionRepository.update(sessionId, {
      status: VideoUploadSessionStatus.COMPLETED,
    });
  }

  async markAborted(sessionId: string): Promise<void> {
    await this.sessionRepository.update(sessionId, {
      status: VideoUploadSessionStatus.ABORTED,
    });
  }

  async findActiveExpired(
    limit: number,
    now: Date,
  ): Promise<VideoUploadSession[]> {
    const rows = await this.sessionRepository.find({
      where: {
        status: VideoUploadSessionStatus.ACTIVE,
        expiresAt: LessThanOrEqual(now),
      },
      relations: { parts: true },
      order: { expiresAt: 'ASC' },
      take: limit,
    });

    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: VideoUploadSessionOrmEntity): VideoUploadSession {
    return {
      id: row.id,
      videoId: row.videoId,
      userId: row.userId,
      rawFileKey: row.rawFileKey,
      uploadId: row.uploadId,
      partSizeBytes: row.partSizeBytes,
      fileName: row.fileName,
      fileSize: Number(row.fileSize),
      fileLastModified: row.fileLastModified,
      status: row.status,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      parts: (row.parts ?? [])
        .map((part) => ({
          partNumber: part.partNumber,
          etag: part.etag,
          sizeBytes: Number(part.sizeBytes),
          uploadedAt: part.uploadedAt,
        }))
        .sort((left, right) => left.partNumber - right.partNumber),
    };
  }
}
