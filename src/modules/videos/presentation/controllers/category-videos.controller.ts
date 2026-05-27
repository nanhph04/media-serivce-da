import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { SkipInternalGatewayGuard } from '@shared/presentation/decorators/skip-internal-gateway.decorator';
import { ApiResponse } from '@shared/presentation/dto/api-response.dto';
import { GetVideosByCategoryUseCase } from '../../application/use-cases/get-videos-by-category.use-case';
import { VideoListItemResponseDto } from '../dtos/video-list-item.response';
import { parseVideoLimit, parseVideoPage } from '../dtos/video-query-parser';

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
      page: parseVideoPage(page),
      limit: parseVideoLimit(limit),
    });

    return ApiResponse.success(
      result.items.map((row) =>
        VideoListItemResponseDto.fromApplicationDto(row),
      ),
      undefined,
      result.pagination,
    );
  }
}
