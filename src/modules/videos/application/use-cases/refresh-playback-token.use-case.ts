import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { NotFoundException } from '@shared/domain/exceptions/domain.exception';
import { PlaybackTokenService } from '@shared/infrastructure/security/playback-token.service';
import { VideoWatchAccessService } from '../services/video-watch-access.service';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import type { RefreshPlaybackTokenCommand } from '../dtos/refresh-playback-token.command';
import type { RefreshPlaybackTokenResponse } from '../dtos/refresh-playback-token.response';

@Injectable()
export class RefreshPlaybackTokenUseCase extends BaseUseCase<
  RefreshPlaybackTokenCommand,
  RefreshPlaybackTokenResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    private readonly videoWatchAccessService: VideoWatchAccessService,
    private readonly playbackTokenService: PlaybackTokenService,
  ) {
    super();
  }

  async execute(
    command: RefreshPlaybackTokenCommand,
  ): Promise<RefreshPlaybackTokenResponse> {
    const video = await this.videoRepository.findBasicById(command.videoId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    await this.videoWatchAccessService.assertCanWatch(video, command.userId);

    const playbackToken = this.playbackTokenService.issueToken({
      videoId: video.id,
      userId: command.userId,
      channelId: video.channelId,
    });

    return {
      videoId: video.id,
      playbackToken,
      playbackUrl: `/api/media/stream/${video.id}/master.m3u8?token=${playbackToken}`,
    };
  }
}
