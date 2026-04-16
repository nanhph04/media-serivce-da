import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  mapVideoEntityToListItem,
  type VideoListItemResponse,
} from '../dtos/video-list-item.response';
import type { GetLatestVideosQuery } from '../dtos/latest-videos.query';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';

@Injectable()
export class GetLatestVideosUseCase extends BaseUseCase<
  GetLatestVideosQuery,
  VideoListItemResponse[]
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
  ) {
    super();
  }

  async execute(query: GetLatestVideosQuery): Promise<VideoListItemResponse[]> {
    const videos = await this.videoRepository.findLatestPublic(query.limit);
    return videos.map(mapVideoEntityToListItem);
  }
}
