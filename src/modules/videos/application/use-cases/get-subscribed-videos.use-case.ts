import { Inject, Injectable } from '@nestjs/common';
import {
  createPagination,
  type PaginatedResponse,
} from '@shared/application/dtos/paginated.response';
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
  PaginatedResponse<VideoListItemResponse>
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
  ): Promise<PaginatedResponse<VideoListItemResponse>> {
    // "Subscribed" discovery is currently backed by active memberships only.
    // It is a feed of fresh public videos, not a source of membership details.
    const channelIds =
      await this.channelAccessService.getActiveMembershipChannelIds(
        query.userId,
      );

    const result = await this.videoRepository.findByChannelIds(
      channelIds,
      query.page,
      query.limit,
    );

    return {
      items: result.items.map(mapVideoEntityToListItem),
      pagination: createPagination(query.page, query.limit, result.total),
    };
  }
}
