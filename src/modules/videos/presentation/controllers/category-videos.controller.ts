import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { SkipInternalGatewayGuard } from '@shared/presentation/decorators/skip-internal-gateway.decorator';
import { ApiResponse } from '@shared/presentation/dto/api-response.dto';
import { GetVideosByCategoryUseCase } from '../../application/use-cases/get-videos-by-category.use-case';
import type { VideoListItemResponse } from '../../application/dtos/video-list-item.response';
import { VideoListItemResponseDto } from '../dtos/video-list-item.response';

@ApiTags('categories')
@Controller('categories')
export class CategoryVideosController {
  constructor(
    private readonly getVideosByCategoryUseCase: GetVideosByCategoryUseCase,
  ) {}

  @Get(':slug/videos')
  @SkipInternalGatewayGuard()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiSuccessResponse(VideoListItemResponseDto, { isArray: true })
  async getVideosByCategory(
    @Param('slug') category: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<VideoListItemResponseDto[]>> {
    const result = await this.getVideosByCategoryUseCase.execute({
      category,
      page: this.parsePage(page),
      limit: this.parseLimit(limit),
    });

    return ApiResponse.success(
      result.items.map((row) => this.toVideoListItemDto(row)),
      undefined,
      result.pagination,
    );
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
      tags: video.tags,
      status: video.status,
      price: video.price,
      requiredTierLevel: video.requiredTierLevel,
      thumbnailUrl: video.thumbnailUrl,
      thumbnailSource: video.thumbnailSource,
      thumbnailStatus: video.thumbnailStatus,
      durationSeconds: video.durationSeconds,
      resolutions: video.resolutions,
      errorMessage: video.errorMessage,
      viewCount: video.viewCount,
      publishedAt: video.publishedAt?.toISOString() ?? null,
      createdAt: video.createdAt.toISOString(),
      updatedAt: video.updatedAt.toISOString(),
    };
  }

  private parseLimit(limit?: string): number {
    const parsed = Number(limit) || 20;
    return Math.min(Math.max(parsed, 1), 50);
  }

  private parsePage(page?: string): number {
    const parsed = Number(page) || 1;
    return Math.max(parsed, 1);
  }
}
