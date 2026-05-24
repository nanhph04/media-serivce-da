import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import type { PaginatedResponse } from '@shared/application/dtos/paginated.response';
import type { StudioVideoListItemResponse } from '../dtos/studio-video-list-item.response';
import type { GetStudioVideosQuery } from '../dtos/studio-videos.query';
import {
  type IVideoQueryService,
  VIDEO_QUERY_SERVICE,
} from '../interfaces/video-query.service.interface';

@Injectable()
export class GetStudioVideosUseCase extends BaseUseCase<
  GetStudioVideosQuery,
  PaginatedResponse<StudioVideoListItemResponse>
> {
  constructor(
    @Inject(VIDEO_QUERY_SERVICE)
    private readonly videoQueryService: IVideoQueryService,
  ) {
    super();
  }

  async execute(
    query: GetStudioVideosQuery,
  ): Promise<PaginatedResponse<StudioVideoListItemResponse>> {
    return this.videoQueryService.getStudioVideos(query.userId, {
      page: query.page,
      limit: query.limit,
      statuses: query.statuses,
      visibilities: query.visibilities,
    });
  }
}
