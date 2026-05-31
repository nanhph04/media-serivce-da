import { Inject, Injectable } from '@nestjs/common';
import type { PaginatedResponse } from '@shared/application/dtos/paginated.response';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import type { RankedVideoListItemResponse } from '../dtos/ranked-video-list-item.response';
import type { GetRankedVideosQuery } from '../dtos/ranked-videos.query';
import {
  type IVideoQueryService,
  VIDEO_QUERY_SERVICE,
} from '../interfaces/video-query.service.interface';

@Injectable()
export class GetRankedVideosUseCase extends BaseUseCase<
  GetRankedVideosQuery,
  PaginatedResponse<RankedVideoListItemResponse>
> {
  constructor(
    @Inject(VIDEO_QUERY_SERVICE)
    private readonly videoQueryService: IVideoQueryService,
  ) {
    super();
  }

  async execute(
    query: GetRankedVideosQuery,
  ): Promise<PaginatedResponse<RankedVideoListItemResponse>> {
    return this.videoQueryService.getRankedVideos(query);
  }
}
