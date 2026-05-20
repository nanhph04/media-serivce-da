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
import type { VideoUploadStatusResponse } from '../dtos/video-upload-session.response';
import { VideoUploadSessionUseCaseBase } from './video-upload-session.use-case.base';

@Injectable()
export class GetVideoUploadStatusUseCase extends BaseUseCase<
  { userId: string; videoId: string; uploadId: string },
  VideoUploadStatusResponse
> {
  private readonly helper: VideoUploadSessionUseCaseBase;

  constructor(
    @Inject(VIDEO_REPOSITORY)
    videoRepository: IVideoRepository,
    @Inject(VIDEO_UPLOAD_SESSION_REPOSITORY)
    uploadSessionRepository: IVideoUploadSessionRepository,
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
  }): Promise<VideoUploadStatusResponse> {
    const session = await this.helper.getActiveOwnedDraftSession(command);

    return {
      videoId: session.videoId,
      uploadId: session.uploadId,
      rawFileKey: session.rawFileKey,
      partSizeBytes: session.partSizeBytes,
      fileName: session.fileName,
      fileSize: session.fileSize,
      fileLastModified: session.fileLastModified.toISOString(),
      status: session.status,
      expiresAt: session.expiresAt.toISOString(),
      parts: session.parts.map((part) => ({
        partNumber: part.partNumber,
        etag: part.etag,
        sizeBytes: part.sizeBytes,
        uploadedAt: part.uploadedAt.toISOString(),
      })),
    };
  }
}

class VideoUploadSessionHelper extends VideoUploadSessionUseCaseBase {}
