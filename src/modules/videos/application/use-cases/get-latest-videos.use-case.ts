import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import type { VideoListItemResponse } from '../dtos/video-list-item.response';
import type { GetLatestVideosQuery } from '../dtos/latest-videos.query';
import {
  type IVideoQueryService,
  VIDEO_QUERY_SERVICE,
} from '../interfaces/video-query.service.interface';

@Injectable()
export class GetLatestVideosUseCase extends BaseUseCase<
  GetLatestVideosQuery,
  VideoListItemResponse[]
> {
  constructor(
    @Inject(VIDEO_QUERY_SERVICE)
    private readonly videoQueryService: IVideoQueryService,
  ) {
    super();
  }

  async execute(query: GetLatestVideosQuery): Promise<VideoListItemResponse[]> {
    return this.videoQueryService.getLatestVideos(query.limit);
  }
}
