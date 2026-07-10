import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
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
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import type { IIntegrationEvent } from '@shared/domain/types/events/base-integration.event';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import {
  type IVideoUploadSessionRepository,
  VideoUploadSessionStatus,
  VIDEO_UPLOAD_SESSION_REPOSITORY,
} from '../../domain/repositories/video-upload-session.repository';
import type { VideoEntity } from '../../domain/entities/video.entity';
import {
  VIDEO_OUTBOX_TRANSACTION,
  type IVideoOutboxTransaction,
} from '../interfaces/video-outbox-transaction.interface';
import {
  VIDEO_STATUS_EVENT_PUBLISHER,
  type IVideoStatusEventPublisher,
} from '../interfaces/video-status-event-publisher.interface';
import {
  MAX_THUMBNAIL_SIZE_BYTES,
  VIDEO_MODERATION_REQUESTED_TOPIC,
} from '../constants/video-moderation.constants';
import { VIDEO_UPLOAD_RESOLUTIONS } from '../dtos/video-upload-resolution';
import type { ConfirmVideoUploadCommand } from '../dtos/confirm-video-upload.command';
import type { ConfirmVideoUploadResponse } from '../dtos/confirm-video-upload.response';
import { mapVideoStatusToJobFields } from '../dtos/video-job-status';

const VIDEO_UPLOAD_RESOLUTION_ORDER = new Map<string, number>(
  VIDEO_UPLOAD_RESOLUTIONS.map((resolution, index) => [resolution, index]),
);

interface VideoModerationRequestedEventData {
  videoId: string;
  rawFileKey: string;
  rawBucket: string;
  resolutions: string[];
  userId: string;
}

@Injectable()
export class ConfirmVideoUploadUseCase extends BaseUseCase<
  ConfirmVideoUploadCommand,
  ConfirmVideoUploadResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(VIDEO_UPLOAD_SESSION_REPOSITORY)
    private readonly uploadSessionRepository: IVideoUploadSessionRepository,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService: IObjectStorageService,
    @Inject(VIDEO_OUTBOX_TRANSACTION)
    private readonly videoOutboxTransaction: IVideoOutboxTransaction,
    @Inject(VIDEO_UPLOAD_CONFIG)
    private readonly videoUploadConfig: IVideoUploadConfig,
    @Inject(VIDEO_STATUS_EVENT_PUBLISHER)
    private readonly videoStatusEventPublisher: IVideoStatusEventPublisher,
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
      throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    }
    if (video.ownerId !== command.userId) {
      throw new ForbiddenException(ERROR_MESSAGES.VIDEO_NOT_OWNED);
    }
    video.assertDraftUploadMutable();
    await this.assertCompletedUploadSession(command);

    const exists = await this.objectStorageService.objectExists(
      'raw',
      video.rawFileKey,
    );
    if (!exists) {
      throw new NotFoundException(ERROR_MESSAGES.RAW_UPLOAD_FILE_NOT_FOUND);
    }

    const rawVideoMetadata = await this.objectStorageService.getObjectMetadata(
      'raw',
      video.rawFileKey,
    );
    if (rawVideoMetadata.sizeBytes <= 0) {
      throw new BadRequestException(
        ERROR_MESSAGES.UPLOADED_VIDEO_EMPTY_OR_INVALID,
      );
    }

    const maxVideoUploadSizeBytes =
      this.videoUploadConfig.getMaxVideoUploadSizeBytes();
    if (rawVideoMetadata.sizeBytes > maxVideoUploadSizeBytes) {
      throw new BadRequestException(
        `${ERROR_MESSAGES.VIDEO_FILE_EXCEEDS_MAX_UPLOAD_SIZE} of ${this.formatBytes(maxVideoUploadSizeBytes)}`,
      );
    }

    const draftRawFileKey = video.rawFileKey;
    const confirmedRawFileKey = this.createConfirmedRawFileKey(video.id);
    await this.objectStorageService.copyObject(
      'raw',
      draftRawFileKey,
      confirmedRawFileKey,
    );

    try {
      video.replaceDraftRawFile(confirmedRawFileKey);
      if (command.thumbnailObjectKey) {
        await this.applyCustomThumbnail(video, command.thumbnailObjectKey);
      } else {
        video.markAutoThumbnailProcessing();
      }
      const normalizedResolutions = [...command.resolutions].sort(
        (left, right) => {
          return (
            (VIDEO_UPLOAD_RESOLUTION_ORDER.get(left) ??
              Number.MAX_SAFE_INTEGER) -
            (VIDEO_UPLOAD_RESOLUTION_ORDER.get(right) ?? Number.MAX_SAFE_INTEGER)
          );
        },
      );

      video.markPendingModeration({ resolutions: normalizedResolutions });
      const event: IIntegrationEvent<VideoModerationRequestedEventData> = {
        eventId: randomUUID(),
        eventType: VIDEO_MODERATION_REQUESTED_TOPIC,
        aggregateId: video.id,
        timestamp: new Date().toISOString(),
        version: 1,
        traceId: randomUUID(),
        sourceService: 'media-service',
        data: {
          videoId: video.id,
          rawFileKey: video.rawFileKey,
          rawBucket: this.objectStorageService.getBucketName('raw'),
          resolutions: normalizedResolutions,
          userId: command.userId,
        },
      };

      await this.videoOutboxTransaction.saveVideoWithOutbox(video, {
        topic: VIDEO_MODERATION_REQUESTED_TOPIC,
        messageKey: video.id,
        payload: event,
      });
    } catch (error: unknown) {
      await this.objectStorageService
        .deleteObject('raw', confirmedRawFileKey)
        .catch((): undefined => undefined);

      throw error;
    }
    this.publishVideoStatusChanged(video);
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

  private async assertCompletedUploadSession(
    command: ConfirmVideoUploadCommand,
  ): Promise<void> {
    const session = await this.uploadSessionRepository.findByVideoAndUploadId(
      command.videoId,
      command.uploadId,
    );
    if (!session) {
      throw new NotFoundException(ERROR_MESSAGES.UPLOAD_SESSION_NOT_FOUND);
    }
    if (session.userId !== command.userId) {
      throw new ForbiddenException(ERROR_MESSAGES.UPLOAD_SESSION_NOT_OWNED);
    }
    if (session.status !== VideoUploadSessionStatus.COMPLETED) {
      throw new ConflictException(ERROR_MESSAGES.UPLOAD_SESSION_NOT_COMPLETED);
    }
  }

  private async applyCustomThumbnail(
    video: VideoEntity,
    thumbnailObjectKey: string,
  ): Promise<void> {
    const expectedPrefix = `videos/${video.id}/thumbnails/custom.`;
    if (!thumbnailObjectKey.startsWith(expectedPrefix)) {
      throw new BadRequestException(
        ERROR_MESSAGES.THUMBNAIL_OBJECT_KEY_INVALID,
      );
    }

    const extension = thumbnailObjectKey.slice(expectedPrefix.length);
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
      throw new BadRequestException(ERROR_MESSAGES.THUMBNAIL_FILE_TYPE_INVALID);
    }

    const exists = await this.objectStorageService.objectExists(
      'public',
      thumbnailObjectKey,
    );
    if (!exists) {
      throw new NotFoundException(
        ERROR_MESSAGES.THUMBNAIL_UPLOAD_FILE_NOT_FOUND,
      );
    }

    const thumbnailMetadata = await this.objectStorageService.getObjectMetadata(
      'public',
      thumbnailObjectKey,
    );
    if (
      thumbnailMetadata.sizeBytes <= 0 ||
      thumbnailMetadata.sizeBytes > MAX_THUMBNAIL_SIZE_BYTES
    ) {
      throw new BadRequestException(
        ERROR_MESSAGES.THUMBNAIL_EMPTY_OR_EXCEEDS_LIMIT,
      );
    }

    video.markCustomThumbnailReady({
      objectKey: thumbnailObjectKey,
      url: this.objectStorageService.createObjectUrl(
        'public',
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

  private publishVideoStatusChanged(video: VideoEntity): void {
    const jobFields = mapVideoStatusToJobFields({
      status: video.status,
      errorMessage: video.errorMessage,
      moderationDetails: video.moderationDetails,
    });

    this.videoStatusEventPublisher.publishVideoStatusChanged({
      videoId: video.id,
      userId: video.ownerId,
      status: video.status,
      thumbnailStatus: video.thumbnailStatus,
      thumbnailUrl: video.thumbnailUrl,
      processingWarnings: video.processingWarnings,
      updatedAt: video.updatedAt.toISOString(),
      ...jobFields,
    });
  }
}
