import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  IDEMPOTENCY_STORE,
  type IIdempotencyStore,
} from '@shared/application/interfaces/cache-store.interface';
import {
  CHANNEL_MEMBERSHIP_ELIGIBILITY_SERVICE,
  type IChannelMembershipEligibilityService,
} from '../../../channels/application/interfaces/channel-membership-eligibility.service.interface';
import type { HandleVideoViewedCommand } from '../dtos/handle-video-viewed.command';
import {
  type IVideoCacheInvalidator,
  VIDEO_CACHE_INVALIDATOR,
} from '../interfaces/video-cache-invalidator.interface';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';

@Injectable()
export class HandleVideoViewedUseCase extends BaseUseCase<
  HandleVideoViewedCommand,
  void
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(CHANNEL_MEMBERSHIP_ELIGIBILITY_SERVICE)
    private readonly channelMembershipEligibilityService: IChannelMembershipEligibilityService,
    @Inject(VIDEO_CACHE_INVALIDATOR)
    private readonly videoCacheInvalidator: IVideoCacheInvalidator,
    @Inject(IDEMPOTENCY_STORE)
    private readonly idempotencyStore: IIdempotencyStore,
  ) {
    super();
  }

  async execute(command: HandleVideoViewedCommand): Promise<void> {
    if (!(await this.markEventProcessed(command.eventId))) {
      return;
    }

    const video = await this.videoRepository.findBasicById(command.data.videoId);

    if (!video) {
      return;
    }

    await this.videoRepository.incrementViewCount(command.data.videoId);
    await this.videoCacheInvalidator.invalidateMetadata(command.data.videoId);
    await this.videoCacheInvalidator.invalidateDiscoveryLists();
    await this.channelMembershipEligibilityService.syncChannelEligibility(
      video.channelId,
    );
  }

  private async markEventProcessed(eventId: string): Promise<boolean> {
    return this.idempotencyStore.setIfNotExists(
      `media:event:${eventId}`,
      '1',
      60 * 60 * 24,
    );
  }
}
