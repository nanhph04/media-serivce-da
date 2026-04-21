import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import type { VideoMetadataResponse } from '../dtos/video-metadata.response';
import {
  type IVideoQueryService,
  VIDEO_QUERY_SERVICE,
} from '../interfaces/video-query.service.interface';

@Injectable()
export class GetVideoMetadataUseCase extends BaseUseCase<
  string,
  VideoMetadataResponse
> {
  constructor(
    @Inject(VIDEO_QUERY_SERVICE)
    private readonly videoQueryService: IVideoQueryService,
  ) {
    super();
  }

  async execute(videoId: string): Promise<VideoMetadataResponse> {
    return this.videoQueryService.getVideoMetadata(videoId);
  }
}
