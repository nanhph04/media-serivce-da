import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import type { VideoListItemResponse } from '../dtos/video-list-item.response';
import type { GetVideosByCategoryQuery } from '../dtos/videos-by-category.query';
import {
  type IVideoQueryService,
  VIDEO_QUERY_SERVICE,
} from '../interfaces/video-query.service.interface';

@Injectable()
export class GetVideosByCategoryUseCase extends BaseUseCase<
  GetVideosByCategoryQuery,
  VideoListItemResponse[]
> {
  constructor(
    @Inject(VIDEO_QUERY_SERVICE)
    private readonly videoQueryService: IVideoQueryService,
  ) {
    super();
  }

  async execute(
    query: GetVideosByCategoryQuery,
  ): Promise<VideoListItemResponse[]> {
    return this.videoQueryService.getVideosByCategory(
      query.category,
      query.limit,
    );
  }
}
