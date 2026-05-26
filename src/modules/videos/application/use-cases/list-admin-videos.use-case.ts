import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  ForbiddenException,
} from '@shared/domain/exceptions/domain.exception';
import {
  VideoStatus,
  VideoVisibility,
  type VideoEntity,
} from '../../domain/entities/video.entity';
import {
  VIDEO_REPOSITORY,
  type IVideoRepository,
} from '../../domain/repositories/video.repository';
import type {
  AdminVideoListItemResponse,
  AdminVideosPageResponse,
} from '../dtos/admin-video.response';
import type { ListAdminVideosQuery } from '../dtos/list-admin-videos.query';
import { mapVideoEntityToStudioListItem } from '../dtos/studio-video-list-item.response';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class ListAdminVideosUseCase extends BaseUseCase<
  ListAdminVideosQuery,
  AdminVideosPageResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
  ) {
    super();
  }

  async execute(query: ListAdminVideosQuery): Promise<AdminVideosPageResponse> {
    this.ensureNonEmpty(query.adminId, 'Admin id is required');
    this.ensureAdminRole(query.role);

    const page = this.normalizePositiveInteger(query.page, DEFAULT_PAGE);
    const limit = Math.min(
      this.normalizePositiveInteger(query.limit, DEFAULT_LIMIT),
      MAX_LIMIT,
    );
    const result = await this.videoRepository.findAdminVideos({
      page,
      limit,
      status: this.parseStatus(query.status),
      visibility: this.parseVisibility(query.visibility),
      channelId: this.normalizeOptionalText(query.channelId),
      ownerId: this.normalizeOptionalText(query.ownerId),
      q: this.normalizeOptionalText(query.q),
    });

    return {
      items: result.items.map((video) => this.toAdminVideoItem(video)),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.total === 0 ? 0 : Math.ceil(result.total / limit),
      },
    };
  }

  private toAdminVideoItem(video: VideoEntity): AdminVideoListItemResponse {
    return {
      ...mapVideoEntityToStudioListItem(video),
      ownerId: video.ownerId,
    };
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

  private normalizePositiveInteger(
    value: number | undefined,
    fallback: number,
  ): number {
    if (value === undefined || !Number.isInteger(value) || value < 1) {
      return fallback;
    }

    return value;
  }

  private normalizeOptionalText(value?: string): string | undefined {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private parseStatus(status?: string): VideoStatus | undefined {
    if (!status) {
      return undefined;
    }

    if (Object.values(VideoStatus).includes(status as VideoStatus)) {
      return status as VideoStatus;
    }

    throw new BadRequestException(ERROR_MESSAGES.VIDEO_STATUS_INVALID);
  }

  private parseVisibility(visibility?: string): VideoVisibility | undefined {
    if (!visibility) {
      return undefined;
    }

    if (
      Object.values(VideoVisibility).includes(visibility as VideoVisibility)
    ) {
      return visibility as VideoVisibility;
    }

    throw new BadRequestException(ERROR_MESSAGES.VIDEO_VISIBILITY_INVALID);
  }
}
