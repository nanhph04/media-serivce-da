import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  CHANNEL_ACCESS_SERVICE,
  type IChannelAccessService,
} from '../../../channels/application/interfaces/channel-access.service.interface';
import {
  mapVideoEntityToListItem,
  type VideoListItemResponse,
} from '../dtos/video-list-item.response';
import type { GetSubscribedVideosQuery } from '../dtos/subscribed-videos.query';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';

@Injectable()
export class GetSubscribedVideosUseCase extends BaseUseCase<
  GetSubscribedVideosQuery,
  VideoListItemResponse[]
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(CHANNEL_ACCESS_SERVICE)
    private readonly channelAccessService: IChannelAccessService,
  ) {
    super();
  }

  async execute(
    query: GetSubscribedVideosQuery,
  ): Promise<VideoListItemResponse[]> {
    const channelIds =
      await this.channelAccessService.getActiveSubscribedChannelIds(
        query.userId,
      );

    const videos = await this.videoRepository.findByChannelIds(
      channelIds,
      query.limit,
    );

    return videos.map(mapVideoEntityToListItem);
  }
}
