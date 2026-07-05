import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  type IVideoUploadSessionRepository,
  VIDEO_UPLOAD_SESSION_REPOSITORY,
} from '../../domain/repositories/video-upload-session.repository';
import type { RenewVideoUploadSessionResponse } from '../dtos/video-upload-session.response';
import { VideoUploadSessionGuardService } from '../services/video-upload-session-guard.service';
import { MULTIPART_UPLOAD_TTL_HOURS } from '../constants/video-upload.constants';

@Injectable()
export class RenewVideoUploadSessionUseCase extends BaseUseCase<
  { userId: string; videoId: string; uploadId: string },
  RenewVideoUploadSessionResponse
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
  }): Promise<RenewVideoUploadSessionResponse> {
    const session =
      await this.uploadSessionGuardService.getActiveOwnedDraftSession(command);
    const expiresAt = new Date(
      Date.now() + MULTIPART_UPLOAD_TTL_HOURS * 60 * 60 * 1000,
    );

    await this.uploadSessionRepository.renewExpiry(session.id, expiresAt);

    return {
      videoId: session.videoId,
      uploadId: session.uploadId,
      expiresAt: expiresAt.toISOString(),
    };
  }
}
