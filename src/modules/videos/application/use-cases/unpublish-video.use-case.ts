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
import type { UnpublishVideoResponse } from '../dtos/unpublish-video.response';

const CREATOR_UNPUBLISH_REASON = 'creator_unpublish';

@Injectable()
export class UnpublishVideoUseCase extends BaseUseCase<
  { userId: string; videoId: string },
  UnpublishVideoResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
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

    video.unpublish({
      deletedBy: command.userId,
      reason: CREATOR_UNPUBLISH_REASON,
    });
    await this.videoRepository.save(video);

    return {
      videoId: video.id,
      unpublished: true,
    };
  }
}
