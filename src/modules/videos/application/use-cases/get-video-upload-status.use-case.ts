import { Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { VideoUploadSessionGuardService } from '../services/video-upload-session-guard.service';
import type { VideoUploadStatusResponse } from '../dtos/video-upload-session.response';

@Injectable()
export class GetVideoUploadStatusUseCase extends BaseUseCase<
  { userId: string; videoId: string; uploadId: string },
  VideoUploadStatusResponse
> {
  constructor(
    private readonly uploadSessionGuardService: VideoUploadSessionGuardService,
  ) {
    super();
  }

  async execute(command: {
    userId: string;
    videoId: string;
    uploadId: string;
  }): Promise<VideoUploadStatusResponse> {
    const session =
      await this.uploadSessionGuardService.getActiveOwnedDraftSession(command);

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
