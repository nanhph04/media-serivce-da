import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import {
  OBJECT_STORAGE_SERVICE,
  type IObjectStorageService,
} from '@shared/application/interfaces/object-storage.service.interface';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  ForbiddenException,
} from '@shared/domain/exceptions/domain.exception';
import {
  CHANNEL_REPOSITORY,
  type IChannelRepository,
} from '../../../channels/domain/repositories/channel.repository';
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
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
} from '../constants/video-pagination.constants';
import type { ListAdminVideosQuery } from '../dtos/list-admin-videos.query';
import { mapVideoEntityToStudioListItem } from '../dtos/studio-video-list-item.response';

@Injectable()
export class ListAdminVideosUseCase extends BaseUseCase<
  ListAdminVideosQuery,
  AdminVideosPageResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService?: IObjectStorageService,
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

    const channelNames = await this.getChannelNamesById(result.items);

    return {
      items: result.items.map((video) =>
        this.toAdminVideoItem(video, channelNames.get(video.channelId) ?? null),
      ),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.total === 0 ? 0 : Math.ceil(result.total / limit),
      },
    };
  }

  private async getChannelNamesById(
    videos: VideoEntity[],
  ): Promise<Map<string, string>> {
    const channelIds = [...new Set(videos.map((video) => video.channelId))];
    const channels = await this.channelRepository.findByIds(channelIds);

    return new Map(
      channels.map((channel) => [channel.id, channel.name] as const),
    );
  }

  private toAdminVideoItem(
    video: VideoEntity,
    channelName: string | null,
  ): AdminVideoListItemResponse {
    return {
      ...mapVideoEntityToStudioListItem(video, this.objectStorageService),
      ownerId: video.ownerId,
      channelName,
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
