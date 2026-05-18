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
  mapVideoEntityToStudioListItem,
  type StudioVideoListItemResponse,
} from '../dtos/studio-video-list-item.response';

@Injectable()
export class GetStudioVideoDetailUseCase extends BaseUseCase<
  { userId: string; videoId: string },
  StudioVideoListItemResponse
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
  }): Promise<StudioVideoListItemResponse> {
    const video = await this.videoRepository.findById(command.videoId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    if (video.ownerId !== command.userId) {
      throw new ForbiddenException('You do not own this video');
    }

    return mapVideoEntityToStudioListItem(video);
  }
}
