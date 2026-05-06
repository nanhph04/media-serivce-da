import { Inject, Injectable } from '@nestjs/common';
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
      throw new BadRequestException(
        'At least one of q or category is required',
      );
    }

    const videos = await this.videoSearchQueryService.searchPublicVideos({
      q,
      category,
      limit: input.limit,
    });

    const channels = q
      ? await this.channelSearchQueryService.searchChannels({
          q,
          limit: input.limit,
        })
      : [];

    return {
      videos,
      channels,
      query: {
        q: q ?? null,
        category: category ?? null,
        limit: input.limit,
      },
    };
  }
}
