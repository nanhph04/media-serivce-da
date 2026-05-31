import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  CHANNEL_REPOSITORY,
  type IChannelRepository,
} from '../../../channels/domain/repositories/channel.repository';
import {
  VIDEO_REPOSITORY,
  type IVideoRepository,
} from '../../domain/repositories/video.repository';
import {
  VIDEO_PURCHASE_UNLOCK_REPOSITORY,
  type IVideoPurchaseUnlockRepository,
} from '../../domain/repositories/video-purchase-unlock.repository';
import type { AdminVideoDetailResponse } from '../dtos/admin-video.response';
import type { GetAdminVideoDetailQuery } from '../dtos/get-admin-video-detail.query';
import { mapVideoEntityToStudioListItem } from '../dtos/studio-video-list-item.response';

@Injectable()
export class GetAdminVideoDetailUseCase extends BaseUseCase<
  GetAdminVideoDetailQuery,
  AdminVideoDetailResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
    @Inject(VIDEO_PURCHASE_UNLOCK_REPOSITORY)
    private readonly unlockRepository: IVideoPurchaseUnlockRepository,
  ) {
    super();
  }

  async execute(
    query: GetAdminVideoDetailQuery,
  ): Promise<AdminVideoDetailResponse> {
    this.ensureNonEmpty(query.adminId, 'Admin id is required');
    this.ensureAdminRole(query.role);
    this.ensureNonEmpty(query.videoId, 'Video id is required');

    const video = await this.videoRepository.findAdminVideoById(query.videoId);
    if (!video) {
      throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    }

    const [channel, purchaseCount] = await Promise.all([
      this.channelRepository.findById(video.channelId),
      this.unlockRepository.countByVideoId(video.id),
    ]);

    return {
      ...mapVideoEntityToStudioListItem(video),
      channelName: channel?.name ?? null,
      ownerId: video.ownerId,
      categoryTitle: video.category.name,
      purchaseCount,
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
}
