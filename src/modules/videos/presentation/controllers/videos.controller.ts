import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiCreatedSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { ApiSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { CurrentUserId } from '@shared/presentation/decorators/user-id.decorator';
import { SkipInternalGatewayGuard } from '@shared/presentation/decorators/skip-internal-gateway.decorator';
import {
  ApiResponse,
  apiResponseContract,
} from '@shared/presentation/dto/api-response.dto';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';
import { VideoVisibility } from '../../domain/entities/video.entity';
import type { VideoListItemResponse } from '../../application/dtos/video-list-item.response';
import { ConfirmVideoUploadUseCase } from '../../application/use-cases/confirm-video-upload.use-case';
import { GetLatestVideosUseCase } from '../../application/use-cases/get-latest-videos.use-case';
import { GetSubscribedVideosUseCase } from '../../application/use-cases/get-subscribed-videos.use-case';
import { GetVideosByCategoryUseCase } from '../../application/use-cases/get-videos-by-category.use-case';
import { InitVideoUploadUseCase } from '../../application/use-cases/init-video-upload.use-case';
import { PlayVideoUseCase } from '../../application/use-cases/play-video.use-case';
import { ConfirmVideoUploadRequestDto } from '../dtos/confirm-video-upload.request';
import { ConfirmVideoUploadResponseDto } from '../dtos/confirm-video-upload.response';
import { InitVideoUploadRequestDto } from '../dtos/init-video-upload.request';
import { InitVideoUploadResponseDto } from '../dtos/init-video-upload.response';
import { PlayVideoResponseDto } from '../dtos/play-video.response';
import { VideoListItemResponseDto } from '../dtos/video-list-item.response';

@ApiTags('videos')
@ApiHeader({ name: 'x-user-id', required: true })
@UseGuards(InternalGatewayGuard)
@Controller('videos')
export class VideosController {
  constructor(
    private readonly initVideoUploadUseCase: InitVideoUploadUseCase,
    private readonly confirmVideoUploadUseCase: ConfirmVideoUploadUseCase,
    private readonly playVideoUseCase: PlayVideoUseCase,
    private readonly getLatestVideosUseCase: GetLatestVideosUseCase,
    private readonly getVideosByCategoryUseCase: GetVideosByCategoryUseCase,
    private readonly getSubscribedVideosUseCase: GetSubscribedVideosUseCase,
  ) {}

  @Post('init-upload')
  @ApiOperation({
    summary: 'Create a draft video and return a presigned upload URL',
  })
  @ApiCreatedSuccessResponse(InitVideoUploadResponseDto)
  async initUpload(
    @CurrentUserId() userId: string,
    @Body() dto: InitVideoUploadRequestDto,
  ): Promise<ApiResponse<InitVideoUploadResponseDto>> {
    return apiResponseContract(
      await this.initVideoUploadUseCase.execute({
        userId,
        channelId: dto.channelId,
        title: dto.title,
        description: dto.description,
        categories: dto.categories,
        visibility: dto.visibility as VideoVisibility,
        price: dto.price,
        requiredTierLevel: dto.requiredTierLevel ?? null,
      }),
    );
  }

  @Post(':id/confirm-upload')
  @ApiCreatedSuccessResponse(ConfirmVideoUploadResponseDto)
  async confirmUpload(
    @CurrentUserId() userId: string,
    @Param('id') videoId: string,
    @Body() dto: ConfirmVideoUploadRequestDto,
  ): Promise<ApiResponse<ConfirmVideoUploadResponseDto>> {
    return apiResponseContract(
      await this.confirmVideoUploadUseCase.execute({
        userId,
        videoId,
        resolutions: dto.resolutions,
      }),
    );
  }

  @Get(':id/play')
  @ApiSuccessResponse(PlayVideoResponseDto)
  async playVideo(
    @CurrentUserId() userId: string,
    @Param('id') videoId: string,
  ): Promise<ApiResponse<PlayVideoResponseDto>> {
    return apiResponseContract(
      await this.playVideoUseCase.execute({
        userId,
        videoId,
      }),
    );
  }

  @Get('discovery/latest')
  @SkipInternalGatewayGuard()
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiSuccessResponse(VideoListItemResponseDto, { isArray: true })
  async latest(
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<VideoListItemResponseDto[]>> {
    const rows = await this.getLatestVideosUseCase.execute({
      limit: Number(limit) || 20,
    });
    return apiResponseContract(rows.map((row) => this.toVideoListItemDto(row)));
  }

  @Get('discovery/by-category')
  @SkipInternalGatewayGuard()
  @ApiQuery({ name: 'category', required: true })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiSuccessResponse(VideoListItemResponseDto, { isArray: true })
  async byCategory(
    @Query('category') category: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<VideoListItemResponseDto[]>> {
    const rows = await this.getVideosByCategoryUseCase.execute({
      category,
      limit: Number(limit) || 20,
    });
    return apiResponseContract(rows.map((row) => this.toVideoListItemDto(row)));
  }

  @Get('discovery/subscribed')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiSuccessResponse(VideoListItemResponseDto, { isArray: true })
  async subscribed(
    @CurrentUserId() userId: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<VideoListItemResponseDto[]>> {
    const rows = await this.getSubscribedVideosUseCase.execute({
      userId,
      limit: Number(limit) || 20,
    });
    return apiResponseContract(rows.map((row) => this.toVideoListItemDto(row)));
  }

  private toVideoListItemDto(
    video: VideoListItemResponse,
  ): VideoListItemResponseDto {
    return {
      id: video.id,
      channelId: video.channelId,
      title: video.title,
      description: video.description,
      categories: video.categories,
      status: video.status,
      price: video.price,
      requiredTierLevel: video.requiredTierLevel,
      thumbnailUrl: video.thumbnailUrl,
      durationSeconds: video.durationSeconds,
      resolutions: video.resolutions,
      viewCount: video.viewCount,
      publishedAt: video.publishedAt?.toISOString() ?? null,
      createdAt: video.createdAt.toISOString(),
      updatedAt: video.updatedAt.toISOString(),
    };
  }
}
