import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
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

@Injectable()
export class VideoUploadSessionGuardService {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(VIDEO_UPLOAD_SESSION_REPOSITORY)
    private readonly uploadSessionRepository: IVideoUploadSessionRepository,
  ) {}

  async getActiveOwnedDraftSession(input: {
    userId: string;
    videoId: string;
    uploadId: string;
  }): Promise<VideoUploadSession> {
    const video = await this.videoRepository.findById(input.videoId);
    if (!video) {
      throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    }
    if (video.ownerId !== input.userId) {
      throw new ForbiddenException(ERROR_MESSAGES.VIDEO_NOT_OWNED);
    }
    if (video.status !== VideoStatus.DRAFT) {
      throw new ConflictException(ERROR_MESSAGES.VIDEO_NOT_DRAFT);
    }

    const session = await this.uploadSessionRepository.findByVideoAndUploadId(
      input.videoId,
      input.uploadId,
    );
    if (!session) {
      throw new NotFoundException(ERROR_MESSAGES.UPLOAD_SESSION_NOT_FOUND);
    }
    if (session.userId !== input.userId) {
      throw new ForbiddenException(ERROR_MESSAGES.UPLOAD_SESSION_NOT_OWNED);
    }
    if (session.status !== VideoUploadSessionStatus.ACTIVE) {
      throw new ConflictException(ERROR_MESSAGES.UPLOAD_SESSION_NOT_ACTIVE);
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      throw new ConflictException(ERROR_MESSAGES.UPLOAD_SESSION_NOT_ACTIVE);
    }

    return session;
  }

  assertPartNumber(session: VideoUploadSession, partNumber: number): void {
    if (!Number.isInteger(partNumber) || partNumber < 1) {
      throw new BadRequestException(ERROR_MESSAGES.PART_NUMBER_INVALID);
    }

    const totalParts = Math.ceil(session.fileSize / session.partSizeBytes);
    if (partNumber > totalParts) {
      throw new BadRequestException(ERROR_MESSAGES.PART_NUMBER_OUT_OF_RANGE);
    }
  }
}
