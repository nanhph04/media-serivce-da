import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import type { UpdateVideoMetadataCommand } from '../dtos/update-video-metadata.command';
import type { VideoMetadataResponse } from '../dtos/video-metadata.response';
import {
  type IVideoCacheInvalidator,
  VIDEO_CACHE_INVALIDATOR,
} from '../interfaces/video-cache-invalidator.interface';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';

@Injectable()
export class UpdateVideoMetadataUseCase extends BaseUseCase<
  UpdateVideoMetadataCommand,
  VideoMetadataResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(VIDEO_CACHE_INVALIDATOR)
    private readonly videoCacheInvalidator: IVideoCacheInvalidator,
  ) {
    super();
  }

  async execute(
    command: UpdateVideoMetadataCommand,
  ): Promise<VideoMetadataResponse> {
    const video = await this.videoRepository.findById(command.videoId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.ownerId !== command.userId) {
      throw new ForbiddenException('You do not own this video');
    }

    video.updateMetadata({
      title: command.title,
      description: command.description,
      thumbnailUrl: command.thumbnailUrl,
    });

    await this.videoRepository.save(video);
    await this.videoCacheInvalidator.invalidateMetadata(video.id);

    return {
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      viewCount: video.viewCount,
      status: video.status,
      visibility: video.visibility,
      publishedAt: video.publishedAt,
      updatedAt: video.updatedAt,
    };
  }
}
