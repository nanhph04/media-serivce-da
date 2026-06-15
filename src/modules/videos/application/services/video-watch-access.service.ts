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

    this.assertViewerPlaybackAvailability(video);

    if (accessContext.channelStatus !== ChannelStatus.ACTIVE) {
      throw new ForbiddenException(ERROR_MESSAGES.CHANNEL_NOT_ACTIVE);
    }

    const hasPurchaseUnlock = await this.unlockRepository.exists(
      video.id,
      userId,
    );

    if (
      video.visibility === VideoVisibility.PUBLIC &&
      video.price === 0 &&
      video.requiredTierLevel === null
    ) {
      return;
    }

    if (hasPurchaseUnlock) {
      return;
    }

    if (
      video.requiredTierLevel === null &&
      accessContext.activeMembershipTierLevel !== null
    ) {
      return;
    }

    if (this.hasRequiredMembership(video, accessContext.activeMembershipTierLevel)) {
      return;
    }

    if (
      video.requiredTierLevel !== null &&
      accessContext.activeMembershipTierLevel !== null &&
      accessContext.activeMembershipTierLevel < video.requiredTierLevel
    ) {
      throw new ForbiddenException(
        ERROR_MESSAGES.VIDEO_MEMBERSHIP_TIER_UPGRADE_REQUIRED,
      );
    }

    throw new ForbiddenException(ERROR_MESSAGES.VIDEO_WATCH_PERMISSION_DENIED);
  }

  async assertCanViewMetadata(
    video: VideoEntity,
    userId?: string | null,
  ): Promise<void> {
    this.assertNotBanned(video);
    this.assertViewerMetadataAvailability(video);

    if (video.visibility === VideoVisibility.PUBLIC) {
      return;
    }

    if (!userId) {
      throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    }

    const accessContext =
      await this.channelAccessService.getViewerAccessContext(
        video.channelId,
        userId,
      );

    if (accessContext.channelOwnerId === userId) {
      return;
    }

    if (accessContext.channelStatus !== ChannelStatus.ACTIVE) {
      throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    }

    const hasPurchaseUnlock = await this.unlockRepository.exists(video.id, userId);

    if (hasPurchaseUnlock || accessContext.activeMembershipTierLevel !== null) {
      return;
    }

    throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
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

  private assertViewerPlaybackAvailability(video: VideoEntity): void {
    if (
      video.status !== VideoStatus.READY ||
      !video.masterPlaylistKey
    ) {
      throw new NotFoundException(
        ERROR_MESSAGES.VIDEO_NOT_AVAILABLE_FOR_PLAYBACK,
      );
    }
  }

  private assertViewerMetadataAvailability(video: VideoEntity): void {
    if (video.status !== VideoStatus.READY || !video.isAvailableForPlayback) {
      throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    }
  }

  private hasRequiredMembership(
    video: VideoEntity,
    activeMembershipTierLevel: number | null,
  ): boolean {
    return (
      video.requiredTierLevel !== null &&
      activeMembershipTierLevel !== null &&
      activeMembershipTierLevel >= video.requiredTierLevel
    );
  }
}
