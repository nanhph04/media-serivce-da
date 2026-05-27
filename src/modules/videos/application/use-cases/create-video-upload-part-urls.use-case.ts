import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  OBJECT_STORAGE_SERVICE,
  type IObjectStorageService,
} from '@shared/application/interfaces/object-storage.service.interface';
import { VideoUploadSessionGuardService } from '../services/video-upload-session-guard.service';
import type { VideoUploadPartUrlsResponse } from '../dtos/video-upload-session.response';

const UPLOAD_PART_URL_EXPIRY_SECONDS = 900;

@Injectable()
export class CreateVideoUploadPartUrlsUseCase extends BaseUseCase<
  { userId: string; videoId: string; uploadId: string; partNumbers: number[] },
  VideoUploadPartUrlsResponse
> {
  constructor(
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
    partNumbers: number[];
  }): Promise<VideoUploadPartUrlsResponse> {
    const session =
      await this.uploadSessionGuardService.getActiveOwnedDraftSession(command);
    const uniquePartNumbers = [...new Set(command.partNumbers)];

    for (const partNumber of uniquePartNumbers) {
      this.uploadSessionGuardService.assertPartNumber(session, partNumber);
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
