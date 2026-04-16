import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '@shared/presentation/decorators/user-id.decorator';
import { VideoVisibility } from '../../domain/entities/video.entity';
import { VideoApplicationService } from '../../application/video.application.service';
import {
  ConfirmVideoUploadRequestDto,
  InitVideoUploadRequestDto,
  VideoResponseDto,
} from '../dtos/video.dto';

@ApiTags('videos')
@ApiHeader({ name: 'x-user-id', required: true })
@Controller('videos')
export class VideosController {
  constructor(
    private readonly videoApplicationService: VideoApplicationService,
  ) {}

  @Post('init-upload')
  @ApiOperation({
    summary: 'Create a draft video and return a presigned upload URL',
  })
  async initUpload(
    @CurrentUserId() userId: string,
    @Body() dto: InitVideoUploadRequestDto,
  ) {
    return this.videoApplicationService.initUpload({
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
  ) {
    return this.videoApplicationService.confirmUpload({
      userId,
      videoId,
      resolutions: dto.resolutions,
    });
  }

  @Get(':id/play')
  async playVideo(
    @CurrentUserId() userId: string,
    @Param('id') videoId: string,
  ) {
    return this.videoApplicationService.playVideo({
      userId,
      videoId,
    });
  }

  @Get('discovery/latest')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async latest(@Query('limit') limit?: string): Promise<VideoResponseDto[]> {
    const rows = await this.videoApplicationService.getLatest(
      Number(limit) || 20,
    );
    return rows.map((row) => this.toDto(row));
  }

  @Get('discovery/by-category')
  @ApiQuery({ name: 'category', required: true })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async byCategory(
    @Query('category') category: string,
    @Query('limit') limit?: string,
  ): Promise<VideoResponseDto[]> {
    const rows = await this.videoApplicationService.getByCategory(
      category,
      Number(limit) || 20,
    );
    return rows.map((row) => this.toDto(row));
  }

  @Get('discovery/subscribed')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async subscribed(
    @CurrentUserId() userId: string,
    @Query('limit') limit?: string,
  ): Promise<VideoResponseDto[]> {
    const rows = await this.videoApplicationService.getSubscribed(
      userId,
      Number(limit) || 20,
    );
    return rows.map((row) => this.toDto(row));
  }

  private toDto(video: {
    id: string;
    channelId: string;
    title: string;
    description: string;
    category: string;
    status: string;
    price: number;
    requiredTierLevel: number | null;
    thumbnailUrl: string | null;
    durationSeconds: number | null;
    resolutions: string[];
    viewCount: number;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): VideoResponseDto {
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
