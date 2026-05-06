import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import type { HandleVideoViewedCommand } from '../dtos/handle-video-viewed.command';
import {
  type IVideoViewAggregation,
  VIDEO_VIEW_AGGREGATION,
} from '../interfaces/video-view-aggregation.interface';

@Injectable()
export class HandleVideoViewedUseCase extends BaseUseCase<
  HandleVideoViewedCommand,
  void
> {
  constructor(
    @Inject(VIDEO_VIEW_AGGREGATION)
    private readonly videoViewAggregation: IVideoViewAggregation,
  ) {
    super();
  }

  async execute(command: HandleVideoViewedCommand): Promise<void> {
    await this.videoViewAggregation.recordViewedEvent(
      command.eventId,
      command.data.videoId,
    );
  }
}
