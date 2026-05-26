import { Inject, Injectable } from '@nestjs/common';
import {
  OBJECT_STORAGE_SERVICE,
  type IObjectStorageService,
} from '@shared/application/interfaces/object-storage.service.interface';
import {
  VIDEO_PROCESSING_JOB_DISPATCHER,
  type IVideoProcessingJobDispatcher,
} from '@shared/application/interfaces/video-processing-job-dispatcher.interface';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import {
  VIDEO_REPOSITORY,
  type IVideoRepository,
} from '../../domain/repositories/video.repository';
import type { AdminVideoDetailResponse } from '../dtos/admin-video.response';
import type { ModerateAdminVideoCommand } from '../dtos/moderate-admin-video.command';
import { mapVideoEntityToStudioListItem } from '../dtos/studio-video-list-item.response';
import {
  type IVideoCacheInvalidator,
  VIDEO_CACHE_INVALIDATOR,
} from '../interfaces/video-cache-invalidator.interface';
import {
  VIDEO_MODERATION_OUTCOME_PUBLISHER,
  type IVideoModerationOutcomePublisher,
} from '../interfaces/video-moderation-outcome-publisher.interface';
import {
  VIDEO_STATUS_EVENT_PUBLISHER,
  type IVideoStatusEventPublisher,
} from '../interfaces/video-status-event-publisher.interface';
import { mapVideoStatusToJobFields } from '../dtos/video-job-status';
import {
  VideoThumbnailSource,
  type VideoEntity,
} from '../../domain/entities/video.entity';

@Injectable()
export class ModerateAdminVideoUseCase extends BaseUseCase<
  ModerateAdminVideoCommand,
  AdminVideoDetailResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(VIDEO_CACHE_INVALIDATOR)
    private readonly videoCacheInvalidator: IVideoCacheInvalidator,
    @Inject(VIDEO_PROCESSING_JOB_DISPATCHER)
    private readonly videoProcessingJobDispatcher: IVideoProcessingJobDispatcher,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService: IObjectStorageService,
    @Inject(VIDEO_MODERATION_OUTCOME_PUBLISHER)
    private readonly moderationOutcomePublisher: IVideoModerationOutcomePublisher,
    @Inject(VIDEO_STATUS_EVENT_PUBLISHER)
    private readonly videoStatusEventPublisher: IVideoStatusEventPublisher,
  ) {
    super();
  }

  async execute(
    command: ModerateAdminVideoCommand,
  ): Promise<AdminVideoDetailResponse> {
    this.ensureNonEmpty(command.adminId, 'Admin id is required');
    this.ensureAdminRole(command.role);
    this.ensureNonEmpty(command.videoId, 'Video id is required');

    const video = await this.videoRepository.findAdminVideoById(
      command.videoId,
    );
    if (!video) {
      throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    }

    if (command.action === 'approve') {
      video.approveManualReviewForProcessing();
      await this.videoRepository.save(video);
      this.publishVideoStatusChanged(video);
      await this.videoProcessingJobDispatcher.enqueueTranscodeJob({
        videoId: video.id,
        rawFileKey: video.rawFileKey,
        resolution: video.resolutions,
        userId: video.ownerId,
        thumbnailTargetObjectKey:
          video.thumbnailSource === VideoThumbnailSource.AUTO
            ? this.createAutoThumbnailObjectKey(video.id)
            : undefined,
        thumbnailTargetBucket:
          video.thumbnailSource === VideoThumbnailSource.AUTO
            ? this.objectStorageService.getBucketName('public')
            : undefined,
      });
      await this.moderationOutcomePublisher.publishModerationOutcome({
        videoId: video.id,
        moderationStatus: 'PENDING_MANUAL_REVIEW',
        videoStatus: video.status,
        outcome: 'QUEUED_FOR_PROCESSING',
        reason:
          video.moderationDetails?.reason ?? 'Manually approved for processing',
        confidence: video.moderationDetails?.confidence ?? 0,
        evidenceTimestampSeconds:
          video.moderationDetails?.evidenceTimestampSeconds ?? null,
        transcodeQueued: true,
      });
    } else {
      video.rejectManualReview(command.reason ?? '');
      await this.videoRepository.save(video);
    }

    await this.videoCacheInvalidator.invalidateMetadata(video.id);
    await this.videoCacheInvalidator.invalidateDiscoveryLists();

    return {
      ...mapVideoEntityToStudioListItem(video),
      ownerId: video.ownerId,
    };
  }

  private createAutoThumbnailObjectKey(videoId: string): string {
    return `videos/${videoId}/thumbnails/default.jpg`;
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

  private ensureNonEmpty(value: string, message: string): void {
    if (!value.trim()) {
      throw new BadRequestException(message);
    }
  }

  private ensureAdminRole(role: string | undefined): void {
    if (role !== 'admin') {
      throw new ForbiddenException(ERROR_MESSAGES.ADMIN_ROLE_REQUIRED);
    }
  }
}
