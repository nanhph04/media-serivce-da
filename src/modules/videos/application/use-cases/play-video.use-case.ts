import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import { PlaybackTokenService } from '@shared/infrastructure/security/playback-token.service';
import { RecordVideoViewUseCase } from '../../../engagement/application/use-cases/record-video-view.use-case';
import {
  CHANNEL_ACCESS_SERVICE,
  type IChannelAccessService,
} from '../../../channels/application/interfaces/channel-access.service.interface';
import { VideoEntity, VideoStatus } from '../../domain/entities/video.entity';
import {
  type IVideoPurchaseUnlockRepository,
  VIDEO_PURCHASE_UNLOCK_REPOSITORY,
} from '../../domain/repositories/video-purchase-unlock.repository';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
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
    @Inject(VIDEO_PURCHASE_UNLOCK_REPOSITORY)
    private readonly unlockRepository: IVideoPurchaseUnlockRepository,
    @Inject(CHANNEL_ACCESS_SERVICE)
    private readonly channelAccessService: IChannelAccessService,
    private readonly playbackTokenService: PlaybackTokenService,
    private readonly recordVideoViewUseCase: RecordVideoViewUseCase,
  ) {
    super();
  }

  async execute(command: PlayVideoCommand): Promise<PlayVideoResponse> {
    const video = await this.videoRepository.findById(command.videoId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    await this.assertAccess(video, command.userId);

    const playbackToken = this.playbackTokenService.issueToken({
      videoId: video.id,
      userId: command.userId,
      channelId: video.channelId,
    });

    await this.recordVideoViewUseCase.execute({
      videoId: video.id,
      userId: command.userId,
    });

    return {
      videoId: video.id,
      title: video.title,
      description: video.description,
      playbackToken,
      playbackUrl: `/api/media/stream/${video.id}/master.m3u8?token=${playbackToken}`,
    };
  }

  private async assertAccess(
    video: VideoEntity,
    userId: string,
  ): Promise<void> {
    if (video.status !== VideoStatus.PUBLIC) {
      throw new NotFoundException('Video is not public');
    }

    const accessContext =
      await this.channelAccessService.getViewerAccessContext(
        video.channelId,
        userId,
      );

    if (accessContext.channelOwnerId === userId) {
      return;
    }

    if (video.price === 0 && video.requiredTierLevel === null) {
      return;
    }

    if (
      video.requiredTierLevel !== null &&
      accessContext.activeMembershipTierLevel !== null &&
      accessContext.activeMembershipTierLevel >= video.requiredTierLevel
    ) {
      return;
    }

    if (await this.unlockRepository.exists(video.id, userId)) {
      return;
    }

    throw new ForbiddenException(
      'You do not have permission to watch this video',
    );
  }
}
