import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  mapVideoEntityToListItem,
  type VideoListItemResponse,
} from '../dtos/video-list-item.response';
import type { GetVideosByCategoryQuery } from '../dtos/videos-by-category.query';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';

@Injectable()
export class GetVideosByCategoryUseCase extends BaseUseCase<
  GetVideosByCategoryQuery,
  VideoListItemResponse[]
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
  ) {
    super();
  }

  async execute(
    query: GetVideosByCategoryQuery,
  ): Promise<VideoListItemResponse[]> {
    const videos = await this.videoRepository.findByCategory(
      query.category,
      query.limit,
    );
    return videos.map(mapVideoEntityToListItem);
  }
}
