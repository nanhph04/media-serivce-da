import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import {
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  CHANNEL_ACCESS_SERVICE,
  type IChannelAccessService,
} from '../../../channels/application/interfaces/channel-access.service.interface';
import { ChannelStatus } from '../../../channels/domain/entities/channel.entity';
import {
  VideoEntity,
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import {
  type IVideoPurchaseUnlockRepository,
  VIDEO_PURCHASE_UNLOCK_REPOSITORY,
} from '../../domain/repositories/video-purchase-unlock.repository';

@Injectable()
export class VideoWatchAccessService {
  constructor(
    @Inject(VIDEO_PURCHASE_UNLOCK_REPOSITORY)
    private readonly unlockRepository: IVideoPurchaseUnlockRepository,
    @Inject(CHANNEL_ACCESS_SERVICE)
    private readonly channelAccessService: IChannelAccessService,
  ) {}

  async assertCanWatch(video: VideoEntity, userId: string): Promise<void> {
    this.assertNotBanned(video);
    this.assertNotPendingDelete(video);

    const accessContext =
      await this.channelAccessService.getViewerAccessContext(
        video.channelId,
        userId,
      );

    if (accessContext.channelOwnerId === userId) {
      this.assertOwnerCanWatch(video);
      return;
    }

    this.assertViewerAvailability(video);

    if (accessContext.channelStatus !== ChannelStatus.ACTIVE) {
      throw new ForbiddenException(ERROR_MESSAGES.CHANNEL_NOT_ACTIVE);
    }

    const hasPurchaseUnlock = await this.unlockRepository.exists(
      video.id,
      userId,
    );

    if (video.price === 0 && video.requiredTierLevel === null) {
      return;
    }

    if (
      video.requiredTierLevel !== null &&
      accessContext.activeMembershipTierLevel !== null &&
      accessContext.activeMembershipTierLevel >= video.requiredTierLevel
    ) {
      return;
    }

    if (hasPurchaseUnlock) {
      return;
    }

    throw new ForbiddenException(ERROR_MESSAGES.VIDEO_WATCH_PERMISSION_DENIED);
  }

  private assertOwnerCanWatch(video: VideoEntity): void {
    if (video.status === VideoStatus.FAILED || !video.masterPlaylistKey) {
      throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_READY_FOR_PLAYBACK);
    }
  }

  private assertNotBanned(video: VideoEntity): void {
    if (video.status === VideoStatus.BANNED) {
      throw new NotFoundException(
        ERROR_MESSAGES.VIDEO_NOT_AVAILABLE_FOR_PLAYBACK,
      );
    }
  }

  private assertNotPendingDelete(video: VideoEntity): void {
    if (!video.isAvailableForPlayback) {
      throw new NotFoundException(
        ERROR_MESSAGES.VIDEO_NOT_AVAILABLE_FOR_PLAYBACK,
      );
    }
  }

  private assertViewerAvailability(video: VideoEntity): void {
    if (
      video.status !== VideoStatus.READY ||
      video.visibility !== VideoVisibility.PUBLIC ||
      !video.masterPlaylistKey
    ) {
      throw new NotFoundException(
        ERROR_MESSAGES.VIDEO_NOT_AVAILABLE_FOR_PLAYBACK,
      );
    }
  }
}
