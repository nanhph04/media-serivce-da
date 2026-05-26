import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import {
  PLAYBACK_TOKEN_ISSUER,
  type IPlaybackTokenIssuer,
} from '@shared/application/interfaces/playback-token.service.interface';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { NotFoundException } from '@shared/domain/exceptions/domain.exception';
import { VideoWatchAccessService } from '../services/video-watch-access.service';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import {
  type IVideoWatchProgressRepository,
  VIDEO_WATCH_PROGRESS_REPOSITORY,
} from '../../domain/repositories/video-watch-progress.repository';
import type { PlayVideoCommand } from '../dtos/play-video.command';
import type { PlayVideoResponse } from '../dtos/play-video.response';

@Injectable()
export class PlayVideoUseCase extends BaseUseCase<
  PlayVideoCommand,
  PlayVideoResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(VIDEO_WATCH_PROGRESS_REPOSITORY)
    private readonly watchProgressRepository: IVideoWatchProgressRepository,
    private readonly videoWatchAccessService: VideoWatchAccessService,
    @Inject(PLAYBACK_TOKEN_ISSUER)
    private readonly playbackTokenIssuer: IPlaybackTokenIssuer,
  ) {
    super();
  }

  async execute(command: PlayVideoCommand): Promise<PlayVideoResponse> {
    const video = await this.videoRepository.findBasicById(command.videoId);
    if (!video) {
      throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    }

    await this.videoWatchAccessService.assertCanWatch(video, command.userId);
    const progress = await this.watchProgressRepository.findByUserIdAndVideoId(
      command.userId,
      video.id,
    );
    const resumePositionSeconds =
      progress && !progress.isCompleted() ? progress.lastPositionSeconds : 0;

    const playbackToken = this.playbackTokenIssuer.issueToken({
      videoId: video.id,
      userId: command.userId,
      channelId: video.channelId,
    });

    return {
      videoId: video.id,
      title: video.title,
      description: video.description,
      playbackToken,
      playbackUrl: `/api/media/stream/${video.id}/master.m3u8?token=${playbackToken}`,
      resumePositionSeconds,
      isResumeAvailable: resumePositionSeconds > 0,
    };
  }
}
