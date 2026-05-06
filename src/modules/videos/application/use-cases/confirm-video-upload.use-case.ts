import { Inject, Injectable } from '@nestjs/common';
import {
  OBJECT_STORAGE_SERVICE,
  type IObjectStorageService,
} from '@shared/application/interfaces/object-storage.service.interface';
import {
  VIDEO_UPLOAD_CONFIG,
  type IVideoUploadConfig,
} from '@shared/application/interfaces/video-upload-config.interface';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import {
  VIDEO_MODERATION_REQUEST_PUBLISHER,
  type IVideoModerationRequestPublisher,
} from '../interfaces/video-moderation-request-publisher.interface';
import { VIDEO_UPLOAD_RESOLUTIONS } from '../../presentation/dtos/confirm-video-upload.request';
import type { ConfirmVideoUploadCommand } from '../dtos/confirm-video-upload.command';
import type { ConfirmVideoUploadResponse } from '../dtos/confirm-video-upload.response';
import { VideoProgressService } from '../services/video-progress.service';

const VIDEO_UPLOAD_RESOLUTION_ORDER = new Map<string, number>(
  VIDEO_UPLOAD_RESOLUTIONS.map((resolution, index) => [resolution, index]),
);

@Injectable()
export class ConfirmVideoUploadUseCase extends BaseUseCase<
  ConfirmVideoUploadCommand,
  ConfirmVideoUploadResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService: IObjectStorageService,
    @Inject(VIDEO_MODERATION_REQUEST_PUBLISHER)
    private readonly videoModerationRequestPublisher: IVideoModerationRequestPublisher,
    @Inject(VIDEO_UPLOAD_CONFIG)
    private readonly videoUploadConfig: IVideoUploadConfig,
    private readonly videoProgressService: VideoProgressService,
  ) {
    super();
  }

  async execute(
    command: ConfirmVideoUploadCommand,
  ): Promise<ConfirmVideoUploadResponse> {
    const video = await this.videoRepository.findById(command.videoId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    if (video.ownerId !== command.userId) {
      throw new ForbiddenException('You do not own this video');
    }

    const exists = await this.objectStorageService.objectExists(
      'raw',
      video.rawFileKey,
    );
    if (!exists) {
      throw new NotFoundException('Raw upload file not found');
    }

    const rawVideoMetadata = await this.objectStorageService.getObjectMetadata(
      'raw',
      video.rawFileKey,
    );
    if (rawVideoMetadata.sizeBytes <= 0) {
      throw new BadRequestException('Uploaded video file is empty or invalid');
    }

    const maxVideoUploadSizeBytes =
      this.videoUploadConfig.getMaxVideoUploadSizeBytes();
    if (rawVideoMetadata.sizeBytes > maxVideoUploadSizeBytes) {
      throw new BadRequestException(
        `Video file exceeds maximum upload size of ${this.formatBytes(maxVideoUploadSizeBytes)}`,
      );
    }

    const normalizedResolutions = [...command.resolutions].sort(
      (left, right) => {
        return (
          (VIDEO_UPLOAD_RESOLUTION_ORDER.get(left) ?? Number.MAX_SAFE_INTEGER) -
          (VIDEO_UPLOAD_RESOLUTION_ORDER.get(right) ?? Number.MAX_SAFE_INTEGER)
        );
      },
    );

    video.markPendingModeration();
    await this.videoRepository.save(video);
    await this.videoModerationRequestPublisher.publishModerationRequested({
      videoId: video.id,
      rawFileKey: video.rawFileKey,
      rawBucket: this.objectStorageService.getBucketName('raw'),
      resolution: normalizedResolutions,
      userId: command.userId,
    });
    await this.videoProgressService.applyProgressUpdate(
      this.videoProgressService.createSnapshot({
        videoId: video.id,
        stage: 'pending_moderation',
        percent: 10,
        message: 'Video queued for moderation',
        terminal: false,
      }),
    );

    return {
      status: video.status,
      message: 'Video dang duoc xu ly, ban se nhan duoc thong bao khi hoan tat',
    };
  }

  private formatBytes(sizeBytes: number): string {
    const sizeInGiB = sizeBytes / (1024 * 1024 * 1024);
    return `${sizeInGiB.toFixed(sizeInGiB >= 10 ? 0 : 1)}GB`;
  }
}
