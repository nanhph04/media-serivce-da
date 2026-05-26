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
    @Inject(PLAYBACK_TOKEN_ISSUER)
    private readonly playbackTokenIssuer: IPlaybackTokenIssuer,
  ) {
    super();
  }

  async execute(
    command: RefreshPlaybackTokenCommand,
  ): Promise<RefreshPlaybackTokenResponse> {
    const video = await this.videoRepository.findBasicById(command.videoId);
    if (!video) {
      throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    }

    await this.videoWatchAccessService.assertCanWatch(video, command.userId);

    const playbackToken = this.playbackTokenIssuer.issueToken({
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
