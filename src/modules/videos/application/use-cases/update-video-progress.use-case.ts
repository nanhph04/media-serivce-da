import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { NotFoundException } from '@shared/domain/exceptions/domain.exception';
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

    return {
      videoId: progress.videoId,
      positionSeconds: progress.lastPositionSeconds,
      completed: progress.isCompleted(),
    };
  }
}
