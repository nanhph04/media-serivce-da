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
import { LoggerService } from '@shared/infrastructure/logger/logger.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import type { VideoEntity } from '../../domain/entities/video.entity';
import {
  VIDEO_MODERATION_REQUEST_PUBLISHER,
  type IVideoModerationRequestPublisher,
} from '../interfaces/video-moderation-request-publisher.interface';
import { VIDEO_UPLOAD_RESOLUTIONS } from '../../presentation/dtos/confirm-video-upload.request';
import type { ConfirmVideoUploadCommand } from '../dtos/confirm-video-upload.command';
import type { ConfirmVideoUploadResponse } from '../dtos/confirm-video-upload.response';

const VIDEO_UPLOAD_RESOLUTION_ORDER = new Map<string, number>(
  VIDEO_UPLOAD_RESOLUTIONS.map((resolution, index) => [resolution, index]),
);
const MAX_THUMBNAIL_SIZE_BYTES = 5 * 1024 * 1024;

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
    private readonly loggerService: LoggerService,
  ) {
    super();
    this.loggerService.setContext(ConfirmVideoUploadUseCase.name);
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
    video.assertDraftUploadMutable();

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

    const draftRawFileKey = video.rawFileKey;
    const confirmedRawFileKey = this.createConfirmedRawFileKey(video.id);
    await this.objectStorageService.copyObject(
      'raw',
      draftRawFileKey,
      confirmedRawFileKey,
    );

    video.replaceDraftRawFile(confirmedRawFileKey);
    if (command.thumbnailObjectKey) {
      await this.applyCustomThumbnail(video, command.thumbnailObjectKey);
    } else {
      video.markAutoThumbnailProcessing();
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
    await this.deleteDraftRawFileIfPresent(draftRawFileKey);

    return {
      status: video.status,
      message: 'Video is waiting for moderation',
    };
  }

  private formatBytes(sizeBytes: number): string {
    const sizeInGiB = sizeBytes / (1024 * 1024 * 1024);
    return `${sizeInGiB.toFixed(sizeInGiB >= 10 ? 0 : 1)}GB`;
  }

  private createConfirmedRawFileKey(videoId: string): string {
    return `uploads/confirmed/${videoId}/${crypto.randomUUID()}.mp4`;
  }

  private async applyCustomThumbnail(
    video: VideoEntity,
    thumbnailObjectKey: string,
  ): Promise<void> {
    const expectedPrefix = `videos/${video.id}/thumbnails/custom.`;
    if (!thumbnailObjectKey.startsWith(expectedPrefix)) {
      throw new BadRequestException('Thumbnail object key is invalid');
    }

    const extension = thumbnailObjectKey.slice(expectedPrefix.length);
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
      throw new BadRequestException('Thumbnail file type is invalid');
    }

    const exists = await this.objectStorageService.objectExists(
      'processed',
      thumbnailObjectKey,
    );
    if (!exists) {
      throw new NotFoundException('Thumbnail upload file not found');
    }

    const thumbnailMetadata = await this.objectStorageService.getObjectMetadata(
      'processed',
      thumbnailObjectKey,
    );
    if (
      thumbnailMetadata.sizeBytes <= 0 ||
      thumbnailMetadata.sizeBytes > MAX_THUMBNAIL_SIZE_BYTES
    ) {
      throw new BadRequestException('Thumbnail file is empty or exceeds 5MB');
    }

    video.markCustomThumbnailReady({
      objectKey: thumbnailObjectKey,
      url: this.objectStorageService.createObjectUrl(
        'processed',
        thumbnailObjectKey,
      ),
    });
  }

  private async deleteDraftRawFileIfPresent(rawFileKey: string): Promise<void> {
    try {
      if (await this.objectStorageService.objectExists('raw', rawFileKey)) {
        await this.objectStorageService.deleteObject('raw', rawFileKey);
      }
    } catch (error: unknown) {
      this.loggerService.logWarn(
        'Failed to delete confirmed draft raw object',
        {
          rawFileKey,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      );
    }
  }
}
