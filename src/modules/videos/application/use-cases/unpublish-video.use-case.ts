import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import {
  type IVideoDeleteRequestPublisher,
  VIDEO_DELETE_REQUEST_PUBLISHER,
} from '../interfaces/video-delete-request-publisher.interface';
import type { UnpublishVideoResponse } from '../dtos/unpublish-video.response';

const CREATOR_DELETE_REASON = 'creator_delete';
const REFUND_WINDOW_HOURS = 72;

@Injectable()
export class UnpublishVideoUseCase extends BaseUseCase<
  { userId: string; videoId: string },
  UnpublishVideoResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(VIDEO_DELETE_REQUEST_PUBLISHER)
    private readonly videoDeleteRequestPublisher: IVideoDeleteRequestPublisher,
  ) {
    super();
  }

  async execute(command: {
    userId: string;
    videoId: string;
  }): Promise<UnpublishVideoResponse> {
    const video = await this.videoRepository.findById(command.videoId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    if (video.ownerId !== command.userId) {
      throw new ForbiddenException('You do not own this video');
    }

    if (!video.isDeletePending) {
      video.unpublish({
        deletedBy: command.userId,
        reason: CREATOR_DELETE_REASON,
      });
      await this.videoRepository.save(video);
    }

    await this.videoDeleteRequestPublisher.publishVideoDeleteRequested({
      videoId: video.id,
      channelId: video.channelId,
      ownerId: video.ownerId,
      deletedBy: command.userId,
      deletedAt: (video.deleteRequestedAt ?? new Date()).toISOString(),
      refundWindowHours: REFUND_WINDOW_HOURS,
    });

    return {
      videoId: video.id,
      unpublished: true,
    };
  }
}
