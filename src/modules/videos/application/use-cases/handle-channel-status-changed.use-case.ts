import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import type { ChannelStatusChangedEventData } from '../../../channels/application/interfaces/channel-status-event.publisher.interface';
import {
  VIDEO_CACHE_INVALIDATOR,
  type IVideoCacheInvalidator,
} from '../interfaces/video-cache-invalidator.interface';

@Injectable()
export class HandleChannelStatusChangedUseCase extends BaseUseCase<
  ChannelStatusChangedEventData,
  void
> {
  constructor(
    @Inject(VIDEO_CACHE_INVALIDATOR)
    private readonly videoCacheInvalidator: IVideoCacheInvalidator,
  ) {
    super();
  }

  async execute(_event: ChannelStatusChangedEventData): Promise<void> {
    await this.videoCacheInvalidator.invalidateDiscoveryLists();
  }
}
