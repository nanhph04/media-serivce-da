import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  type IVideoUploadSessionRepository,
  VIDEO_UPLOAD_SESSION_REPOSITORY,
} from '../../domain/repositories/video-upload-session.repository';
import { VideoUploadSessionGuardService } from '../services/video-upload-session-guard.service';
import type { VideoUploadPartCompletedResponse } from '../dtos/video-upload-session.response';

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
  constructor(
    @Inject(VIDEO_UPLOAD_SESSION_REPOSITORY)
    private readonly uploadSessionRepository: IVideoUploadSessionRepository,
    private readonly uploadSessionGuardService: VideoUploadSessionGuardService,
  ) {
    super();
  }

  async execute(command: {
    userId: string;
    videoId: string;
    uploadId: string;
    partNumber: number;
    etag: string;
    sizeBytes: number;
  }): Promise<VideoUploadPartCompletedResponse> {
    const session =
      await this.uploadSessionGuardService.getActiveOwnedDraftSession(command);
    this.uploadSessionGuardService.assertPartNumber(
      session,
      command.partNumber,
    );

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
