import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import {
  OBJECT_STORAGE_SERVICE,
  type IObjectStorageService,
} from '@shared/application/interfaces/object-storage.service.interface';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import {
  type IVideoUploadSessionRepository,
  VideoUploadSessionStatus,
  VIDEO_UPLOAD_SESSION_REPOSITORY,
} from '../../domain/repositories/video-upload-session.repository';
import type { CancelVideoUploadResponse } from '../dtos/cancel-video-upload.response';

@Injectable()
export class CancelVideoUploadUseCase extends BaseUseCase<
  { userId: string; videoId: string; uploadId?: string },
  CancelVideoUploadResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService: IObjectStorageService,
    @Inject(VIDEO_UPLOAD_SESSION_REPOSITORY)
    private readonly uploadSessionRepository: IVideoUploadSessionRepository,
  ) {
    super();
  }

  async execute(command: {
    userId: string;
    videoId: string;
    uploadId?: string;
  }): Promise<CancelVideoUploadResponse> {
    const video = await this.videoRepository.findById(command.videoId);
    if (!video) {
      throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    }
    if (video.ownerId !== command.userId) {
      throw new ForbiddenException(ERROR_MESSAGES.VIDEO_NOT_OWNED);
    }

    video.assertDraftUploadMutable();
    if (command.uploadId) {
      const session = await this.uploadSessionRepository.findByVideoAndUploadId(
        video.id,
        command.uploadId,
      );
      if (session && session.status === VideoUploadSessionStatus.ACTIVE) {
        await this.objectStorageService.abortMultipartUpload({
          bucket: 'raw',
          objectKey: session.rawFileKey,
          uploadId: session.uploadId,
        });
        await this.uploadSessionRepository.markAborted(session.id);
      }
    }

    if (await this.objectStorageService.objectExists('raw', video.rawFileKey)) {
      await this.objectStorageService.deleteObject('raw', video.rawFileKey);
    }
    await this.videoRepository.deleteDraftById(video.id);

    return {
      videoId: video.id,
      cancelled: true,
    };
  }
}
