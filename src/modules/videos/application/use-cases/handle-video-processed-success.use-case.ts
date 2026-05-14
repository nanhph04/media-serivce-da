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
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import { VideoStatus } from '../../domain/entities/video.entity';
import type { HandleVideoProcessedSuccessCommand } from '../dtos/handle-video-processed-success.command';
import { LoggerService } from '@shared/infrastructure/logger/logger.service';
import {
  type IVideoCacheInvalidator,
  VIDEO_CACHE_INVALIDATOR,
} from '../interfaces/video-cache-invalidator.interface';

@Injectable()
export class HandleVideoProcessedSuccessUseCase extends BaseUseCase<
  HandleVideoProcessedSuccessCommand,
  void
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(CHANNEL_MEMBERSHIP_ELIGIBILITY_SERVICE)
    private readonly channelMembershipEligibilityService: IChannelMembershipEligibilityService,
    @Inject(IDEMPOTENCY_STORE)
    private readonly idempotencyStore: IIdempotencyStore,
    private readonly loggerService: LoggerService,
    @Inject(VIDEO_CACHE_INVALIDATOR)
    private readonly videoCacheInvalidator: IVideoCacheInvalidator,
  ) {
    super();
    this.loggerService.setContext(HandleVideoProcessedSuccessUseCase.name);
  }

  async execute(command: HandleVideoProcessedSuccessCommand): Promise<void> {
    if (!(await this.markEventProcessed(command.eventId))) {
      return;
    }

    const video = await this.videoRepository.findById(command.data.videoId);
    if (!video) {
      return;
    }

    if (video.status !== VideoStatus.PROCESSING) {
      this.loggerService.logWarn(
        'Ignoring stale video processed success event',
        {
          eventId: command.eventId,
          videoId: command.data.videoId,
          currentStatus: video.status,
        },
      );
      return;
    }

    video.markReady({
      masterPlaylistKey: command.data.masterPlaylistKey,
      durationSeconds: command.data.durationSeconds ?? null,
      thumbnailUrl: command.data.thumbnailUrl ?? null,
      resolutions: command.data.resolution ?? [],
    });

    await this.videoRepository.save(video);
    await this.videoCacheInvalidator.invalidateMetadata(video.id);
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
