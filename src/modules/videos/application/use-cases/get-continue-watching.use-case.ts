import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import type { ContinueWatchingQuery } from '../dtos/continue-watching.query';
import type { ContinueWatchingResponse } from '../dtos/continue-watching.response';
import {
  type IVideoQueryService,
  VIDEO_QUERY_SERVICE,
} from '../interfaces/video-query.service.interface';

@Injectable()
export class GetContinueWatchingUseCase extends BaseUseCase<
  ContinueWatchingQuery,
  ContinueWatchingResponse
> {
  constructor(
    @Inject(VIDEO_QUERY_SERVICE)
    private readonly videoQueryService: IVideoQueryService,
  ) {
    super();
  }

  async execute(
    query: ContinueWatchingQuery,
  ): Promise<ContinueWatchingResponse> {
    return this.videoQueryService.getContinueWatching(query.userId, query.limit);
  }
}
