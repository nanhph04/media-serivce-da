import { Inject } from '@nestjs/common';
import {
  OBJECT_STORAGE_SERVICE,
  type IObjectStorageService,
} from '@shared/application/interfaces/object-storage.service.interface';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import { VideoStatus } from '../../domain/entities/video.entity';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import {
  type IVideoUploadSessionRepository,
  type VideoUploadSession,
  VideoUploadSessionStatus,
  VIDEO_UPLOAD_SESSION_REPOSITORY,
} from '../../domain/repositories/video-upload-session.repository';

export abstract class VideoUploadSessionUseCaseBase {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    protected readonly videoRepository: IVideoRepository,
    @Inject(VIDEO_UPLOAD_SESSION_REPOSITORY)
    protected readonly uploadSessionRepository: IVideoUploadSessionRepository,
    @Inject(OBJECT_STORAGE_SERVICE)
    protected readonly objectStorageService: IObjectStorageService,
  ) {}

  async getActiveOwnedDraftSession(input: {
    userId: string;
    videoId: string;
    uploadId: string;
  }): Promise<VideoUploadSession> {
    const video = await this.videoRepository.findById(input.videoId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    if (video.ownerId !== input.userId) {
      throw new ForbiddenException('You do not own this video');
    }
    if (video.status !== VideoStatus.DRAFT) {
      throw new ConflictException('Video is not in draft status');
    }

    const session =
      await this.uploadSessionRepository.findByVideoAndUploadId(
        input.videoId,
        input.uploadId,
      );
    if (!session) {
      throw new NotFoundException('Upload session not found');
    }
    if (session.userId !== input.userId) {
      throw new ForbiddenException('You do not own this upload session');
    }
    if (session.status !== VideoUploadSessionStatus.ACTIVE) {
      throw new ConflictException('Upload session is not active');
    }

    return session;
  }

  assertPartNumber(session: VideoUploadSession, partNumber: number): void {
    if (!Number.isInteger(partNumber) || partNumber < 1) {
      throw new BadRequestException('Part number is invalid');
    }

    const totalParts = Math.ceil(session.fileSize / session.partSizeBytes);
    if (partNumber > totalParts) {
      throw new BadRequestException('Part number is out of range');
    }
  }
}
