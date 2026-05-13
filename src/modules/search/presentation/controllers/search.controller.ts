import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { SkipInternalGatewayGuard } from '@shared/presentation/decorators/skip-internal-gateway.decorator';
import {
  ApiResponse,
  apiResponseContract,
} from '@shared/presentation/dto/api-response.dto';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';
import type { ChannelSearchItemResponse } from '../../application/dtos/channel-search-item.response';
import type { SearchContentResponse } from '../../application/dtos/search-content.response';
import { SearchContentUseCase } from '../../application/use-cases/search-content.use-case';
import type { VideoListItemResponse } from '../../../videos/application/dtos/video-list-item.response';
import { VideoListItemResponseDto } from '../../../videos/presentation/dtos/video-list-item.response';
import { ChannelSearchItemResponseDto } from '../dtos/channel-search-item.response';
import { SearchContentRequestDto } from '../dtos/search-content.request';
import { SearchContentResponseDto } from '../dtos/search-content.response';

@ApiTags('search')
@UseGuards(InternalGatewayGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchContentUseCase: SearchContentUseCase) {}

  @Get()
  @SkipInternalGatewayGuard()
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiSuccessResponse(SearchContentResponseDto)
  async search(
    @Query() query: SearchContentRequestDto,
  ): Promise<ApiResponse<SearchContentResponseDto>> {
    const result = await this.searchContentUseCase.execute({
      q: query.q,
      category: query.category,
      limit: query.limit,
    });

    return apiResponseContract(this.toSearchContentResponseDto(result));
  }

  private toSearchContentResponseDto(
    result: SearchContentResponse,
  ): SearchContentResponseDto {
    return {
      videos: result.videos.map((video) => this.toVideoListItemDto(video)),
      channels: result.channels.map((channel) =>
        this.toChannelSearchItemDto(channel),
      ),
      query: result.query,
    };
  }

  private toVideoListItemDto(
    video: VideoListItemResponse,
  ): VideoListItemResponseDto {
    return {
      id: video.id,
      channelId: video.channelId,
      title: video.title,
      description: video.description,
      category: video.category,
      categories: video.categories,
      tags: video.tags,
      status: video.status,
      price: video.price,
      requiredTierLevel: video.requiredTierLevel,
      thumbnailUrl: video.thumbnailUrl,
      durationSeconds: video.durationSeconds,
      resolutions: video.resolutions,
      errorMessage: video.errorMessage,
      viewCount: video.viewCount,
      publishedAt: video.publishedAt?.toISOString() ?? null,
      createdAt: video.createdAt.toISOString(),
      updatedAt: video.updatedAt.toISOString(),
    };
  }

  private toChannelSearchItemDto(
    channel: ChannelSearchItemResponse,
  ): ChannelSearchItemResponseDto {
    return {
      id: channel.id,
      userId: channel.userId,
      name: channel.name,
      bio: channel.bio,
      avatarUrl: channel.avatarUrl,
      bannerUrl: channel.bannerUrl,
      status: channel.status,
      isEligibleForMembership: channel.isEligibleForMembership,
      createdAt: channel.createdAt.toISOString(),
      updatedAt: channel.updatedAt.toISOString(),
    };
  }
}
