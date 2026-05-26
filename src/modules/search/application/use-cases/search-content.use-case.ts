import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { BadRequestException } from '@shared/domain/exceptions/domain.exception';
import type { SearchContentQuery } from '../dtos/search-content.query';
import type { SearchContentResponse } from '../dtos/search-content.response';
import {
  CHANNEL_SEARCH_QUERY_SERVICE,
  type IChannelSearchQueryService,
} from '../../../channels/application/interfaces/channel-search-query.service.interface';
import {
  VIDEO_SEARCH_QUERY_SERVICE,
  type IVideoSearchQueryService,
} from '../../../videos/application/interfaces/video-search-query.service.interface';

@Injectable()
export class SearchContentUseCase extends BaseUseCase<
  SearchContentQuery,
  SearchContentResponse
> {
  constructor(
    @Inject(VIDEO_SEARCH_QUERY_SERVICE)
    private readonly videoSearchQueryService: IVideoSearchQueryService,
    @Inject(CHANNEL_SEARCH_QUERY_SERVICE)
    private readonly channelSearchQueryService: IChannelSearchQueryService,
  ) {
    super();
  }

  async execute(input: SearchContentQuery): Promise<SearchContentResponse> {
    const q = input.q?.trim() || undefined;
    const category = input.category?.trim() || undefined;

    if (!q && !category) {
      throw new BadRequestException(ERROR_MESSAGES.SEARCH_QUERY_REQUIRED);
    }

    const videos = await this.videoSearchQueryService.searchPublicVideos({
      q,
      category,
      page: input.page,
      limit: input.limit,
    });

    const channels = q
      ? await this.channelSearchQueryService.searchChannels({
          q,
          limit: input.limit,
        })
      : [];

    return {
      videos: videos.items,
      channels,
      query: {
        q: q ?? null,
        category: category ?? null,
        page: input.page,
        limit: input.limit,
      },
      pagination: videos.pagination,
    };
  }
}
