import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { NotFoundException } from '@shared/domain/exceptions/domain.exception';
import {
  VIDEO_VIEW_CONFIG,
  type IVideoViewConfig,
} from '@shared/application/interfaces/video-view-config.interface';
import type { UpdateVideoProgressCommand } from '../dtos/update-video-progress.command';
import type { UpdateVideoProgressResponse } from '../dtos/update-video-progress.response';
import { VideoWatchAccessService } from '../services/video-watch-access.service';
import {
  type IVideoWatchProgressRepository,
  VIDEO_WATCH_PROGRESS_REPOSITORY,
} from '../../domain/repositories/video-watch-progress.repository';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import { VideoWatchProgressEntity } from '../../domain/entities/video-watch-progress.entity';
import { RecordVideoViewUseCase } from '../../../engagement/application/use-cases/record-video-view.use-case';

@Injectable()
export class UpdateVideoProgressUseCase extends BaseUseCase<
  UpdateVideoProgressCommand,
  UpdateVideoProgressResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(VIDEO_WATCH_PROGRESS_REPOSITORY)
    private readonly watchProgressRepository: IVideoWatchProgressRepository,
    private readonly videoWatchAccessService: VideoWatchAccessService,
    private readonly recordVideoViewUseCase: RecordVideoViewUseCase,
    @Inject(VIDEO_VIEW_CONFIG)
    private readonly videoViewConfig: IVideoViewConfig,
  ) {
    super();
  }

  async execute(
    command: UpdateVideoProgressCommand,
  ): Promise<UpdateVideoProgressResponse> {
    const video = await this.videoRepository.findBasicById(command.videoId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    await this.videoWatchAccessService.assertCanWatch(video, command.userId);

    const existingProgress =
      await this.watchProgressRepository.findByUserIdAndVideoId(
        command.userId,
        command.videoId,
      );
    const progress =
      existingProgress ??
      VideoWatchProgressEntity.create({
        userId: command.userId,
        videoId: command.videoId,
        channelId: video.channelId,
        positionSeconds: command.positionSeconds,
        durationSeconds: command.durationSeconds,
        state: command.state,
      });

    if (existingProgress) {
      const wasUpdated = progress.updateProgress({
        positionSeconds: command.positionSeconds,
        durationSeconds: command.durationSeconds,
        state: command.state,
      });

      if (!wasUpdated) {
        return {
          videoId: progress.videoId,
          positionSeconds: progress.lastPositionSeconds,
          completed: progress.isCompleted(),
        };
      }
    }

    await this.watchProgressRepository.save(progress);
    await this.recordViewIfThresholdReached({
      userId: command.userId,
      videoId: command.videoId,
      currentPositionSeconds: progress.lastPositionSeconds,
      currentDurationSeconds: progress.durationSeconds ?? video.durationSeconds,
    });

    return {
      videoId: progress.videoId,
      positionSeconds: progress.lastPositionSeconds,
      completed: progress.isCompleted(),
    };
  }

  private async recordViewIfThresholdReached(input: {
    userId: string;
    videoId: string;
    currentPositionSeconds: number;
    currentDurationSeconds: number | null;
  }): Promise<void> {
    const currentThresholdReached = this.hasReachedViewThreshold(
      input.currentPositionSeconds,
      input.currentDurationSeconds,
    );

    if (!currentThresholdReached) {
      return;
    }

    try {
      await this.recordVideoViewUseCase.execute({
        userId: input.userId,
        videoId: input.videoId,
      });
    } catch {
      // View recording must not fail progress persistence.
    }
  }

  private hasReachedViewThreshold(
    positionSeconds: number,
    durationSeconds: number | null,
  ): boolean {
    const minSeconds = this.videoViewConfig.getVideoViewMinSeconds();
    const minPercent = this.videoViewConfig.getVideoViewMinPercent();
    const percentThreshold =
      durationSeconds !== null ? (durationSeconds * minPercent) / 100 : null;
    const requiredSeconds =
      percentThreshold !== null
        ? Math.max(minSeconds, percentThreshold)
        : minSeconds;
    const thresholdSeconds =
      durationSeconds !== null
        ? Math.min(requiredSeconds, durationSeconds)
        : requiredSeconds;

    return positionSeconds >= Math.max(thresholdSeconds, 0);
  }
}
