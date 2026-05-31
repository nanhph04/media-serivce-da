import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import type { HandleVideoViewedCommand } from '../dtos/handle-video-viewed.command';
import {
  type IVideoViewAggregation,
  VIDEO_VIEW_AGGREGATION,
} from '../interfaces/video-view-aggregation.interface';
import {
  type IVideoViewStatRepository,
  VIDEO_VIEW_STAT_REPOSITORY,
} from '../interfaces/video-view-stat.repository.interface';

@Injectable()
export class HandleVideoViewedUseCase extends BaseUseCase<
  HandleVideoViewedCommand,
  void
> {
  constructor(
    @Inject(VIDEO_VIEW_AGGREGATION)
    private readonly videoViewAggregation: IVideoViewAggregation,
    @Inject(VIDEO_VIEW_STAT_REPOSITORY)
    private readonly videoViewStatRepository: IVideoViewStatRepository,
  ) {
    super();
  }

  async execute(command: HandleVideoViewedCommand): Promise<void> {
    const wasRecorded = await this.videoViewAggregation.recordViewedEvent(
      command.eventId,
      command.data.videoId,
    );

    if (!wasRecorded) {
      return;
    }

    await this.videoViewStatRepository.incrementDailyView(
      command.data.videoId,
      this.toEventDate(command.timestamp),
    );
  }

  private toEventDate(timestamp: string): Date {
    const parsedDate = new Date(timestamp);

    if (Number.isNaN(parsedDate.getTime())) {
      return new Date();
    }

    return parsedDate;
  }
}
