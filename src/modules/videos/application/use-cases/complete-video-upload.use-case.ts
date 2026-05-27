import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import {
  OBJECT_STORAGE_SERVICE,
  type IObjectStorageService,
} from '@shared/application/interfaces/object-storage.service.interface';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { BadRequestException } from '@shared/domain/exceptions/domain.exception';
import {
  type IVideoUploadSessionRepository,
  VIDEO_UPLOAD_SESSION_REPOSITORY,
} from '../../domain/repositories/video-upload-session.repository';
import { VideoUploadSessionGuardService } from '../services/video-upload-session-guard.service';
import type { CompleteVideoUploadResponse } from '../dtos/video-upload-session.response';

@Injectable()
export class CompleteVideoUploadUseCase extends BaseUseCase<
  { userId: string; videoId: string; uploadId: string },
  CompleteVideoUploadResponse
> {
  constructor(
    @Inject(VIDEO_UPLOAD_SESSION_REPOSITORY)
    private readonly uploadSessionRepository: IVideoUploadSessionRepository,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService: IObjectStorageService,
    private readonly uploadSessionGuardService: VideoUploadSessionGuardService,
  ) {
    super();
  }

  async execute(command: {
    userId: string;
    videoId: string;
    uploadId: string;
  }): Promise<CompleteVideoUploadResponse> {
    const session =
      await this.uploadSessionGuardService.getActiveOwnedDraftSession(command);
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
