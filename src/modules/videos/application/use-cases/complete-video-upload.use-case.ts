import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import {
  OBJECT_STORAGE_SERVICE,
  type IObjectStorageService,
} from '@shared/application/interfaces/object-storage.service.interface';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { BadRequestException } from '@shared/domain/exceptions/domain.exception';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import {
  type IVideoUploadSessionRepository,
  VIDEO_UPLOAD_SESSION_REPOSITORY,
} from '../../domain/repositories/video-upload-session.repository';
import type { CompleteVideoUploadResponse } from '../dtos/video-upload-session.response';
import { VideoUploadSessionUseCaseBase } from './video-upload-session.use-case.base';

@Injectable()
export class CompleteVideoUploadUseCase extends BaseUseCase<
  { userId: string; videoId: string; uploadId: string },
  CompleteVideoUploadResponse
> {
  private readonly helper: VideoUploadSessionUseCaseBase;

  constructor(
    @Inject(VIDEO_REPOSITORY)
    videoRepository: IVideoRepository,
    @Inject(VIDEO_UPLOAD_SESSION_REPOSITORY)
    private readonly uploadSessionRepository: IVideoUploadSessionRepository,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService: IObjectStorageService,
  ) {
    super();
    this.helper = new VideoUploadSessionHelper(
      videoRepository,
      uploadSessionRepository,
      objectStorageService,
    );
  }

  async execute(command: {
    userId: string;
    videoId: string;
    uploadId: string;
  }): Promise<CompleteVideoUploadResponse> {
    const session = await this.helper.getActiveOwnedDraftSession(command);
    const totalParts = Math.ceil(session.fileSize / session.partSizeBytes);
    const completedPartNumbers = new Set(
      session.parts.map((part) => part.partNumber),
    );

    for (let partNumber = 1; partNumber <= totalParts; partNumber += 1) {
      if (!completedPartNumbers.has(partNumber)) {
        throw new BadRequestException(ERROR_MESSAGES.UPLOAD_MISSING_PARTS);
      }
    }

    const parts = [...session.parts]
      .sort((left, right) => left.partNumber - right.partNumber)
      .map((part) => ({
        partNumber: part.partNumber,
        etag: part.etag,
      }));

    await this.objectStorageService.completeMultipartUpload({
      bucket: 'raw',
      objectKey: session.rawFileKey,
      uploadId: session.uploadId,
      parts,
    });
    await this.uploadSessionRepository.markCompleted(session.id);

    return {
      videoId: session.videoId,
      uploadId: session.uploadId,
      rawFileKey: session.rawFileKey,
      completed: true,
    };
  }
}

class VideoUploadSessionHelper extends VideoUploadSessionUseCaseBase {}
