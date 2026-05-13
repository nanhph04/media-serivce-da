import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import type { VideoListItemResponse } from '../dtos/video-list-item.response';
import {
  type IVideoSearchQueryService,
  type SearchPublicVideosQuery,
  VIDEO_SEARCH_QUERY_SERVICE,
} from '../interfaces/video-search-query.service.interface';

@Injectable()
export class SearchPublicVideosUseCase extends BaseUseCase<
  SearchPublicVideosQuery,
  VideoListItemResponse[]
> {
  constructor(
    @Inject(VIDEO_SEARCH_QUERY_SERVICE)
    private readonly videoSearchQueryService: IVideoSearchQueryService,
  ) {
    super();
  }

  async execute(
    query: SearchPublicVideosQuery,
  ): Promise<VideoListItemResponse[]> {
    return this.videoSearchQueryService.searchPublicVideos(query);
  }
}
