import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { GetContinueWatchingUseCase } from '../../application/use-cases/get-continue-watching.use-case';
import { GetLatestVideosUseCase } from '../../application/use-cases/get-latest-videos.use-case';
import { GetSubscribedVideosUseCase } from '../../application/use-cases/get-subscribed-videos.use-case';
import { GetVideoMetadataUseCase } from '../../application/use-cases/get-video-metadata.use-case';
import { GetVideosByCategoryUseCase } from '../../application/use-cases/get-videos-by-category.use-case';
import { InitVideoUploadUseCase } from '../../application/use-cases/init-video-upload.use-case';
import { PlayVideoUseCase } from '../../application/use-cases/play-video.use-case';
import { RefreshPlaybackTokenUseCase } from '../../application/use-cases/refresh-playback-token.use-case';
import { UpdateVideoProgressUseCase } from '../../application/use-cases/update-video-progress.use-case';
import { UpdateVideoMetadataUseCase } from '../../application/use-cases/update-video-metadata.use-case';
import type { ContinueWatchingItemResponse } from '../../application/dtos/continue-watching-item.response';
import { ConfirmVideoUploadRequestDto } from '../dtos/confirm-video-upload.request';
import { ConfirmVideoUploadResponseDto } from '../dtos/confirm-video-upload.response';
import { ContinueWatchingItemResponseDto } from '../dtos/continue-watching-item.response';
import { InitVideoUploadRequestDto } from '../dtos/init-video-upload.request';
import { InitVideoUploadResponseDto } from '../dtos/init-video-upload.response';
import { PlayVideoResponseDto } from '../dtos/play-video.response';
import { RefreshPlaybackTokenResponseDto } from '../dtos/refresh-playback-token.response';
import { UpdateVideoMetadataRequestDto } from '../dtos/update-video-metadata.request';
import { UpdateVideoProgressRequestDto } from '../dtos/update-video-progress.request';
import { UpdateVideoProgressResponseDto } from '../dtos/update-video-progress.response';
import { VideoListItemResponseDto } from '../dtos/video-list-item.response';
import { VideoMetadataResponseDto } from '../dtos/video-metadata.response';
import type { VideoMetadataResponse } from '../../application/dtos/video-metadata.response';
import type { UpdateVideoProgressResponse } from '../../application/dtos/update-video-progress.response';

@ApiTags('videos')
@ApiHeader({ name: 'x-user-id', required: true })
@UseGuards(InternalGatewayGuard)
@Controller('videos')
export class VideosController {
  constructor(
    private readonly initVideoUploadUseCase: InitVideoUploadUseCase,
    private readonly confirmVideoUploadUseCase: ConfirmVideoUploadUseCase,
    private readonly playVideoUseCase: PlayVideoUseCase,
    private readonly updateVideoProgressUseCase: UpdateVideoProgressUseCase,
    private readonly refreshPlaybackTokenUseCase: RefreshPlaybackTokenUseCase,
    private readonly getContinueWatchingUseCase: GetContinueWatchingUseCase,
    private readonly getLatestVideosUseCase: GetLatestVideosUseCase,
    private readonly getVideosByCategoryUseCase: GetVideosByCategoryUseCase,
    private readonly getSubscribedVideosUseCase: GetSubscribedVideosUseCase,
    private readonly getVideoMetadataUseCase: GetVideoMetadataUseCase,
    private readonly updateVideoMetadataUseCase: UpdateVideoMetadataUseCase,
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

  @Post(':id/progress')
  @ApiSuccessResponse(UpdateVideoProgressResponseDto)
  async updateProgress(
    @CurrentUserId() userId: string,
    @Param('id') videoId: string,
    @Body() dto: UpdateVideoProgressRequestDto,
  ): Promise<ApiResponse<UpdateVideoProgressResponseDto>> {
    const response = await this.updateVideoProgressUseCase.execute({
      userId,
      videoId,
      positionSeconds: dto.positionSeconds,
      durationSeconds: dto.durationSeconds,
      state: dto.state,
    });

    return apiResponseContract(this.toUpdateVideoProgressDto(response));
  }

  @Post(':id/playback-token/refresh')
  @ApiSuccessResponse(RefreshPlaybackTokenResponseDto)
  async refreshPlaybackToken(
    @CurrentUserId() userId: string,
    @Param('id') videoId: string,
  ): Promise<ApiResponse<RefreshPlaybackTokenResponseDto>> {
    return apiResponseContract(
      await this.refreshPlaybackTokenUseCase.execute({
        userId,
        videoId,
      }),
    );
  }

  @Get(':id/metadata')
  @SkipInternalGatewayGuard()
  @ApiSuccessResponse(VideoMetadataResponseDto)
  async getMetadata(
    @Param('id') videoId: string,
  ): Promise<ApiResponse<VideoMetadataResponseDto>> {
    const metadata = await this.getVideoMetadataUseCase.execute(videoId);
    return apiResponseContract(this.toVideoMetadataDto(metadata));
  }

  @Patch(':id/metadata')
  @ApiHeader({ name: 'x-internal-secret', required: true })
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiSuccessResponse(VideoMetadataResponseDto)
  async updateMetadata(
    @CurrentUserId() userId: string,
    @Param('id') videoId: string,
    @Body() dto: UpdateVideoMetadataRequestDto,
  ): Promise<ApiResponse<VideoMetadataResponseDto>> {
    const metadata = await this.updateVideoMetadataUseCase.execute({
      userId,
      videoId,
      title: dto.title,
      description: dto.description,
      thumbnailUrl: dto.thumbnailUrl,
    });
    return apiResponseContract(this.toVideoMetadataDto(metadata));
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

  @Get('continue-watching')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiSuccessResponse(ContinueWatchingItemResponseDto, { isArray: true })
  async continueWatching(
    @CurrentUserId() userId: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<ContinueWatchingItemResponseDto[]>> {
    const rows = await this.getContinueWatchingUseCase.execute({
      userId,
      limit: Number(limit) || 20,
    });
    return apiResponseContract(
      rows.map((row) => this.toContinueWatchingItemDto(row)),
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
      categories: video.categories,
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

  private toVideoMetadataDto(
    metadata: VideoMetadataResponse,
  ): VideoMetadataResponseDto {
    return {
      id: metadata.id,
      title: metadata.title,
      description: metadata.description,
      thumbnailUrl: metadata.thumbnailUrl,
      viewCount: metadata.viewCount,
      status: metadata.status,
      visibility: metadata.visibility,
      errorMessage: metadata.errorMessage,
      publishedAt: metadata.publishedAt?.toISOString() ?? null,
      updatedAt: metadata.updatedAt.toISOString(),
    };
  }

  private toUpdateVideoProgressDto(
    response: UpdateVideoProgressResponse,
  ): UpdateVideoProgressResponseDto {
    return {
      videoId: response.videoId,
      positionSeconds: response.positionSeconds,
      completed: response.completed,
    };
  }

  private toContinueWatchingItemDto(
    item: ContinueWatchingItemResponse,
  ): ContinueWatchingItemResponseDto {
    return {
      videoId: item.videoId,
      channelId: item.channelId,
      title: item.title,
      thumbnailUrl: item.thumbnailUrl,
      durationSeconds: item.durationSeconds,
      resumePositionSeconds: item.resumePositionSeconds,
      remainingSeconds: item.remainingSeconds,
      lastWatchedAt: item.lastWatchedAt.toISOString(),
      viewCount: item.viewCount,
    };
  }
}
