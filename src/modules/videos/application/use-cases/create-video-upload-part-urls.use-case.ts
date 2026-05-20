import { Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  OBJECT_STORAGE_SERVICE,
  type IObjectStorageService,
} from '@shared/application/interfaces/object-storage.service.interface';
import { Inject } from '@nestjs/common';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import {
  type IVideoUploadSessionRepository,
  VIDEO_UPLOAD_SESSION_REPOSITORY,
} from '../../domain/repositories/video-upload-session.repository';
import type { VideoUploadPartUrlsResponse } from '../dtos/video-upload-session.response';
import { VideoUploadSessionUseCaseBase } from './video-upload-session.use-case.base';

const UPLOAD_PART_URL_EXPIRY_SECONDS = 900;

@Injectable()
export class CreateVideoUploadPartUrlsUseCase extends BaseUseCase<
  { userId: string; videoId: string; uploadId: string; partNumbers: number[] },
  VideoUploadPartUrlsResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(VIDEO_UPLOAD_SESSION_REPOSITORY)
    private readonly uploadSessionRepository: IVideoUploadSessionRepository,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService: IObjectStorageService,
  ) {
    super();
  }

  async execute(command: {
    userId: string;
    videoId: string;
    uploadId: string;
    partNumbers: number[];
  }): Promise<VideoUploadPartUrlsResponse> {
    const helper = new VideoUploadSessionHelper(
      this.videoRepository,
      this.uploadSessionRepository,
      this.objectStorageService,
    );
    const session = await helper.getActiveOwnedDraftSession(command);
    const uniquePartNumbers = [...new Set(command.partNumbers)];

    for (const partNumber of uniquePartNumbers) {
      helper.assertPartNumber(session, partNumber);
    }

    const expiresAt = new Date(
      Date.now() + UPLOAD_PART_URL_EXPIRY_SECONDS * 1000,
    ).toISOString();

    return {
      parts: await Promise.all(
        uniquePartNumbers.map(async (partNumber) => ({
          partNumber,
          uploadUrl: await this.objectStorageService.createUploadPartUrl({
            bucket: 'raw',
            objectKey: session.rawFileKey,
            uploadId: session.uploadId,
            partNumber,
            expirySeconds: UPLOAD_PART_URL_EXPIRY_SECONDS,
          }),
          expiresAt,
        })),
      ),
    };
  }
}

class VideoUploadSessionHelper extends VideoUploadSessionUseCaseBase {}
