import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import {
  OBJECT_STORAGE_SERVICE,
  type IObjectStorageService,
} from '@shared/application/interfaces/object-storage.service.interface';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  VideoStatus,
  type VideoEntity,
} from '../../domain/entities/video.entity';
import {
  VIDEO_REPOSITORY,
  type IVideoRepository,
} from '../../domain/repositories/video.repository';
import type { AdminVideoPreviewResponse } from '../dtos/admin-video-preview.response';
import type { GetAdminVideoPreviewQuery } from '../dtos/get-admin-video-preview.query';

const PREVIEW_URL_EXPIRY_SECONDS = 15 * 60;
const PREVIEWABLE_STATUSES = new Set<VideoStatus>([
  VideoStatus.PENDING_MANUAL_REVIEW,
  VideoStatus.REJECTED,
  VideoStatus.PENDING_MODERATION,
  VideoStatus.PROCESSING,
]);

@Injectable()
export class GetAdminVideoPreviewUseCase extends BaseUseCase<
  GetAdminVideoPreviewQuery,
  AdminVideoPreviewResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService: IObjectStorageService,
  ) {
    super();
  }

  async execute(
    query: GetAdminVideoPreviewQuery,
  ): Promise<AdminVideoPreviewResponse> {
    this.ensureNonEmpty(query.adminId, 'Admin id is required');
    this.ensureAdminRole(query.role);
    this.ensureNonEmpty(query.videoId, 'Video id is required');

    const video = await this.videoRepository.findAdminVideoById(query.videoId);
    if (!video) {
      throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    }

    this.ensurePreviewable(video);
    if (
      !(await this.objectStorageService.objectExists('raw', video.rawFileKey))
    ) {
      throw new NotFoundException(
        ERROR_MESSAGES.VIDEO_RAW_PREVIEW_FILE_NOT_FOUND,
      );
    }

    const previewUrl = await this.objectStorageService.createReadUrl(
      'raw',
      video.rawFileKey,
      PREVIEW_URL_EXPIRY_SECONDS,
    );
    const expiresAt = new Date(Date.now() + PREVIEW_URL_EXPIRY_SECONDS * 1000);

    return {
      videoId: video.id,
      previewUrl,
      expiresAt,
      evidenceTimestampSeconds:
        video.moderationDetails?.evidenceTimestampSeconds ?? null,
      moderationDetails: video.moderationDetails,
    };
  }

  private ensurePreviewable(video: VideoEntity): void {
    if (!PREVIEWABLE_STATUSES.has(video.status)) {
      throw new ConflictException(
        ERROR_MESSAGES.VIDEO_RAW_PREVIEW_NOT_AVAILABLE,
      );
    }
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
