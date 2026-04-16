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
import { CurrentUserId } from '@shared/presentation/decorators/user-id.decorator';
import { SkipInternalGatewayGuard } from '@shared/presentation/decorators/skip-internal-gateway.decorator';
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
import type { ConfirmVideoUploadResponseDto } from '../dtos/confirm-video-upload.response';
import { InitVideoUploadRequestDto } from '../dtos/init-video-upload.request';
import type { InitVideoUploadResponseDto } from '../dtos/init-video-upload.response';
import type { LatestVideosResponseDto } from '../dtos/latest-videos.response';
import type { PlayVideoResponseDto } from '../dtos/play-video.response';
import type { SubscribedVideosResponseDto } from '../dtos/subscribed-videos.response';
import type { VideosByCategoryResponseDto } from '../dtos/videos-by-category.response';

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
  async initUpload(
    @CurrentUserId() userId: string,
    @Body() dto: InitVideoUploadRequestDto,
  ): Promise<InitVideoUploadResponseDto> {
    return this.initVideoUploadUseCase.execute({
      userId,
      channelId: dto.channelId,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      visibility: dto.visibility as VideoVisibility,
      price: dto.price,
      requiredTierLevel: dto.requiredTierLevel ?? null,
    });
  }

  @Post(':id/confirm-upload')
  async confirmUpload(
    @CurrentUserId() userId: string,
    @Param('id') videoId: string,
    @Body() dto: ConfirmVideoUploadRequestDto,
  ): Promise<ConfirmVideoUploadResponseDto> {
    return this.confirmVideoUploadUseCase.execute({
      userId,
      videoId,
      resolutions: dto.resolutions,
    });
  }

  @Get(':id/play')
  async playVideo(
    @CurrentUserId() userId: string,
    @Param('id') videoId: string,
  ): Promise<PlayVideoResponseDto> {
    return this.playVideoUseCase.execute({
      userId,
      videoId,
    });
  }

  @Get('discovery/latest')
  @SkipInternalGatewayGuard()
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async latest(
    @Query('limit') limit?: string,
  ): Promise<LatestVideosResponseDto[]> {
    const rows = await this.getLatestVideosUseCase.execute({
      limit: Number(limit) || 20,
    });
    return rows.map((row) => this.toLatestDto(row));
  }

  @Get('discovery/by-category')
  @SkipInternalGatewayGuard()
  @ApiQuery({ name: 'category', required: true })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async byCategory(
    @Query('category') category: string,
    @Query('limit') limit?: string,
  ): Promise<VideosByCategoryResponseDto[]> {
    const rows = await this.getVideosByCategoryUseCase.execute({
      category,
      limit: Number(limit) || 20,
    });
    return rows.map((row) => this.toByCategoryDto(row));
  }

  @Get('discovery/subscribed')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async subscribed(
    @CurrentUserId() userId: string,
    @Query('limit') limit?: string,
  ): Promise<SubscribedVideosResponseDto[]> {
    const rows = await this.getSubscribedVideosUseCase.execute({
      userId,
      limit: Number(limit) || 20,
    });
    return rows.map((row) => this.toSubscribedDto(row));
  }

  private toLatestDto(video: VideoListItemResponse): LatestVideosResponseDto {
    return {
      id: video.id,
      channelId: video.channelId,
      title: video.title,
      description: video.description,
      category: video.category,
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

  private toByCategoryDto(
    video: VideoListItemResponse,
  ): VideosByCategoryResponseDto {
    return {
      id: video.id,
      channelId: video.channelId,
      title: video.title,
      description: video.description,
      category: video.category,
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

  private toSubscribedDto(
    video: VideoListItemResponse,
  ): SubscribedVideosResponseDto {
    return {
      id: video.id,
      channelId: video.channelId,
      title: video.title,
      description: video.description,
      category: video.category,
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
