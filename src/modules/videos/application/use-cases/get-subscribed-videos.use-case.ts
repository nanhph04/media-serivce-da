import { Inject, Injectable } from '@nestjs/common';
import type { PaginatedResponse } from '@shared/application/dtos/paginated.response';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  CHANNEL_ACCESS_SERVICE,
  type IChannelAccessService,
} from '../../../channels/application/interfaces/channel-access.service.interface';
import type { VideoListItemResponse } from '../dtos/video-list-item.response';
import type { GetSubscribedVideosQuery } from '../dtos/subscribed-videos.query';
import {
  type IVideoQueryService,
  VIDEO_QUERY_SERVICE,
} from '../interfaces/video-query.service.interface';

@Injectable()
export class GetSubscribedVideosUseCase extends BaseUseCase<
  GetSubscribedVideosQuery,
  PaginatedResponse<VideoListItemResponse>
> {
  constructor(
    @Inject(CHANNEL_ACCESS_SERVICE)
    private readonly channelAccessService: IChannelAccessService,
    @Inject(VIDEO_QUERY_SERVICE)
    private readonly videoQueryService: IVideoQueryService,
  ) {
    super();
  }

  async execute(
    query: GetSubscribedVideosQuery,
  ): Promise<PaginatedResponse<VideoListItemResponse>> {
    // "Subscribed" discovery is currently backed by active memberships only.
    // It is a feed of fresh public videos, not a source of membership details.
    const channelIds =
      await this.channelAccessService.getActiveMembershipChannelIds(
        query.userId,
      );

    return this.videoQueryService.getPublicVideosByChannelIds(
      channelIds,
      query.page,
      query.limit,
      { includePrivate: true },
    );
  }
}
