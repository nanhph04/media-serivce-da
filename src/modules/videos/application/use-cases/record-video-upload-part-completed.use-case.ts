import { Inject, Injectable } from '@nestjs/common';
import {
  OBJECT_STORAGE_SERVICE,
  type IObjectStorageService,
} from '@shared/application/interfaces/object-storage.service.interface';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import {
  type IVideoUploadSessionRepository,
  VIDEO_UPLOAD_SESSION_REPOSITORY,
} from '../../domain/repositories/video-upload-session.repository';
import type { VideoUploadPartCompletedResponse } from '../dtos/video-upload-session.response';
import { VideoUploadSessionUseCaseBase } from './video-upload-session.use-case.base';

@Injectable()
export class RecordVideoUploadPartCompletedUseCase extends BaseUseCase<
  {
    userId: string;
    videoId: string;
    uploadId: string;
    partNumber: number;
    etag: string;
    sizeBytes: number;
  },
  VideoUploadPartCompletedResponse
> {
  private readonly helper: VideoUploadSessionUseCaseBase;

  constructor(
    @Inject(VIDEO_REPOSITORY)
    videoRepository: IVideoRepository,
    @Inject(VIDEO_UPLOAD_SESSION_REPOSITORY)
    private readonly uploadSessionRepository: IVideoUploadSessionRepository,
    @Inject(OBJECT_STORAGE_SERVICE)
    objectStorageService: IObjectStorageService,
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
    partNumber: number;
    etag: string;
    sizeBytes: number;
  }): Promise<VideoUploadPartCompletedResponse> {
    const session = await this.helper.getActiveOwnedDraftSession(command);
    this.helper.assertPartNumber(session, command.partNumber);

    await this.uploadSessionRepository.savePart({
      sessionId: session.id,
      partNumber: command.partNumber,
      etag: command.etag,
      sizeBytes: command.sizeBytes,
    });

    return {
      videoId: command.videoId,
      uploadId: command.uploadId,
      partNumber: command.partNumber,
      completed: true,
    };
  }
}

class VideoUploadSessionHelper extends VideoUploadSessionUseCaseBase {}
