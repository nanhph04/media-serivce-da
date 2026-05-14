import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Inject,
  Logger,
  MessageEvent,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { concat, fromEvent, interval, merge, Observable, of } from 'rxjs';
import { finalize, map, take, takeUntil } from 'rxjs/operators';
import { ApiCreatedSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { ApiSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { CurrentUserId } from '@shared/presentation/decorators/user-id.decorator';
import { SkipInternalGatewayGuard } from '@shared/presentation/decorators/skip-internal-gateway.decorator';
import {
  ApiResponse,
  apiResponseContract,
} from '@shared/presentation/dto/api-response.dto';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';
import {
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import type { VideoListItemResponse } from '../../application/dtos/video-list-item.response';
import { ConfirmVideoUploadUseCase } from '../../application/use-cases/confirm-video-upload.use-case';
import { GetContinueWatchingUseCase } from '../../application/use-cases/get-continue-watching.use-case';
import { GetLatestVideosUseCase } from '../../application/use-cases/get-latest-videos.use-case';
import { GetPurchasedVideosUseCase } from '../../application/use-cases/get-purchased-videos.use-case';
import { GetStudioVideosUseCase } from '../../application/use-cases/get-studio-videos.use-case';
import { GetSubscribedVideosUseCase } from '../../application/use-cases/get-subscribed-videos.use-case';
import { GetVideoMetadataUseCase } from '../../application/use-cases/get-video-metadata.use-case';
import { GetVideosByCategoryUseCase } from '../../application/use-cases/get-videos-by-category.use-case';
import { InitVideoUploadUseCase } from '../../application/use-cases/init-video-upload.use-case';
import { PlayVideoUseCase } from '../../application/use-cases/play-video.use-case';
import { RefreshPlaybackTokenUseCase } from '../../application/use-cases/refresh-playback-token.use-case';
import { ReplaceVideoUploadUseCase } from '../../application/use-cases/replace-video-upload.use-case';
import { SearchPublicVideosUseCase } from '../../application/use-cases/search-public-videos.use-case';
import { UpdateVideoProgressUseCase } from '../../application/use-cases/update-video-progress.use-case';
import { UpdateVideoMetadataUseCase } from '../../application/use-cases/update-video-metadata.use-case';
import { UnpublishVideoUseCase } from '../../application/use-cases/unpublish-video.use-case';
import { CancelVideoUploadUseCase } from '../../application/use-cases/cancel-video-upload.use-case';
import { DeleteFailedVideoUseCase } from '../../application/use-cases/delete-failed-video.use-case';
import { VideoProgressService } from '../../application/services/video-progress.service';
import type { VideoProgressSnapshot } from '../../application/dtos/video-progress.snapshot';
import type { ContinueWatchingItemResponse } from '../../application/dtos/continue-watching-item.response';
import { ConfirmVideoUploadRequestDto } from '../dtos/confirm-video-upload.request';
import { ConfirmVideoUploadResponseDto } from '../dtos/confirm-video-upload.response';
import { ContinueWatchingItemResponseDto } from '../dtos/continue-watching-item.response';
import { InitVideoUploadRequestDto } from '../dtos/init-video-upload.request';
import { InitVideoUploadResponseDto } from '../dtos/init-video-upload.response';
import { ReplaceVideoUploadResponseDto } from '../dtos/replace-video-upload.response';
import { CancelVideoUploadResponseDto } from '../dtos/cancel-video-upload.response';
import { DeleteFailedVideoResponseDto } from '../dtos/delete-failed-video.response';
import { PlayVideoResponseDto } from '../dtos/play-video.response';
import { RefreshPlaybackTokenResponseDto } from '../dtos/refresh-playback-token.response';
import { UpdateVideoMetadataRequestDto } from '../dtos/update-video-metadata.request';
import { UpdateVideoProgressRequestDto } from '../dtos/update-video-progress.request';
import { UpdateVideoProgressResponseDto } from '../dtos/update-video-progress.response';
import { UnpublishVideoResponseDto } from '../dtos/unpublish-video.response';
import { StudioVideoListItemResponseDto } from '../dtos/studio-video-list-item.response';
import { VideoListItemResponseDto } from '../dtos/video-list-item.response';
import { VideoMetadataResponseDto } from '../dtos/video-metadata.response';
import { VideoProgressResponseDto } from '../dtos/video-progress.response';
import type { StudioVideoListItemResponse } from '../../application/dtos/studio-video-list-item.response';
import type { VideoMetadataResponse } from '../../application/dtos/video-metadata.response';
import type { UpdateVideoProgressResponse } from '../../application/dtos/update-video-progress.response';
import {
  VIDEO_PROGRESS_STREAM,
  type IVideoProgressStream,
} from '../../application/interfaces/video-progress-stream.interface';

@ApiTags('videos')
@ApiHeader({ name: 'x-user-id', required: true })
@UseGuards(InternalGatewayGuard)
@Controller('videos')
export class VideosController {
  private readonly logger = new Logger(VideosController.name);

  constructor(
    private readonly initVideoUploadUseCase: InitVideoUploadUseCase,
    private readonly confirmVideoUploadUseCase: ConfirmVideoUploadUseCase,
    private readonly replaceVideoUploadUseCase: ReplaceVideoUploadUseCase,
    private readonly cancelVideoUploadUseCase: CancelVideoUploadUseCase,
    private readonly deleteFailedVideoUseCase: DeleteFailedVideoUseCase,
    private readonly playVideoUseCase: PlayVideoUseCase,
    private readonly updateVideoProgressUseCase: UpdateVideoProgressUseCase,
    private readonly refreshPlaybackTokenUseCase: RefreshPlaybackTokenUseCase,
    private readonly getContinueWatchingUseCase: GetContinueWatchingUseCase,
    private readonly getLatestVideosUseCase: GetLatestVideosUseCase,
    private readonly getPurchasedVideosUseCase: GetPurchasedVideosUseCase,
    private readonly getStudioVideosUseCase: GetStudioVideosUseCase,
    private readonly getVideosByCategoryUseCase: GetVideosByCategoryUseCase,
    private readonly getSubscribedVideosUseCase: GetSubscribedVideosUseCase,
    private readonly getVideoMetadataUseCase: GetVideoMetadataUseCase,
    private readonly updateVideoMetadataUseCase: UpdateVideoMetadataUseCase,
    private readonly unpublishVideoUseCase: UnpublishVideoUseCase,
    private readonly videoProgressService: VideoProgressService,
    @Inject(VIDEO_PROGRESS_STREAM)
    private readonly videoProgressStream: IVideoProgressStream,
    private readonly searchPublicVideosUseCase: SearchPublicVideosUseCase,
  ) {}

  @Get('me')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'visibility', required: false, type: String })
  @ApiSuccessResponse(StudioVideoListItemResponseDto, { isArray: true })
  async studioVideos(
    @CurrentUserId() userId: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('visibility') visibility?: string,
  ): Promise<ApiResponse<StudioVideoListItemResponseDto[]>> {
    const rows = await this.getStudioVideosUseCase.execute({
      userId,
      limit: this.parseLimit(limit),
      statuses: this.parseStatuses(status),
      visibilities: this.parseVisibilities(visibility),
    });

    return apiResponseContract(
      rows.map((row) => this.toStudioVideoListItemDto(row)),
    );
  }

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
        categoryId: dto.categoryId,
        tagIds: dto.tagIds,
        visibility: dto.visibility as VideoVisibility,
        price: dto.price,
        requiredTierLevel: dto.requiredTierLevel ?? null,
      }),
    );
  }

  @Get()
  @SkipInternalGatewayGuard()
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'tags', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiSuccessResponse(VideoListItemResponseDto, { isArray: true })
  async searchVideos(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('tags') tags?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<VideoListItemResponseDto[]>> {
    const rows = await this.searchPublicVideosUseCase.execute({
      q,
      category,
      tags: this.parseTags(tags),
      limit: this.parseLimit(limit),
    });

    return apiResponseContract(rows.map((row) => this.toVideoListItemDto(row)));
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

  @Post(':id/replace-upload')
  @ApiCreatedSuccessResponse(ReplaceVideoUploadResponseDto)
  async replaceUpload(
    @CurrentUserId() userId: string,
    @Param('id') videoId: string,
  ): Promise<ApiResponse<ReplaceVideoUploadResponseDto>> {
    return apiResponseContract(
      await this.replaceVideoUploadUseCase.execute({
        userId,
        videoId,
      }),
    );
  }

  @Delete(':id/upload')
  @ApiSuccessResponse(CancelVideoUploadResponseDto)
  async cancelUpload(
    @CurrentUserId() userId: string,
    @Param('id') videoId: string,
  ): Promise<ApiResponse<CancelVideoUploadResponseDto>> {
    return apiResponseContract(
      await this.cancelVideoUploadUseCase.execute({
        userId,
        videoId,
      }),
    );
  }

  @Delete(':id/failed-upload')
  @ApiSuccessResponse(DeleteFailedVideoResponseDto)
  async deleteFailedVideo(
    @CurrentUserId() userId: string,
    @Param('id') videoId: string,
  ): Promise<ApiResponse<DeleteFailedVideoResponseDto>> {
    return apiResponseContract(
      await this.deleteFailedVideoUseCase.execute({
        userId,
        videoId,
      }),
    );
  }

  @Delete(':id')
  @ApiSuccessResponse(UnpublishVideoResponseDto)
  async unpublishVideo(
    @CurrentUserId() userId: string,
    @Param('id') videoId: string,
  ): Promise<ApiResponse<UnpublishVideoResponseDto>> {
    return apiResponseContract(
      await this.unpublishVideoUseCase.execute({
        userId,
        videoId,
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

  @Get(':id/progress')
  @ApiSuccessResponse(VideoProgressResponseDto)
  async getProgress(
    @CurrentUserId() userId: string,
    @Param('id') videoId: string,
  ): Promise<ApiResponse<VideoProgressResponseDto>> {
    const snapshot = await this.videoProgressService.getSnapshotForOwner(
      videoId,
      userId,
    );
    return apiResponseContract(this.toVideoProgressDto(snapshot));
  }

  @Sse(':id/progress/stream')
  @Header('Cache-Control', 'no-cache, no-transform')
  @Header('Connection', 'keep-alive')
  @Header('X-Accel-Buffering', 'no')
  async streamProgress(
    @CurrentUserId() userId: string,
    @Param('id') videoId: string,
    @Req() request: Request,
  ): Promise<Observable<MessageEvent>> {
    const initialSnapshot = await this.videoProgressService.getSnapshotForOwner(
      videoId,
      userId,
    );
    const disconnect$ = merge(
      fromEvent(request, 'close'),
      fromEvent(request, 'aborted'),
    ).pipe(take(1));

    const initial$ = of(this.toSseMessage('snapshot', initialSnapshot));
    const live$ = this.videoProgressStream
      .observe(videoId)
      .pipe(
        map((snapshot) =>
          this.toSseMessage(snapshot.terminal ? 'end' : 'progress', snapshot),
        ),
      );
    const heartbeat$ = interval(15000).pipe(
      map(() => ({
        type: 'ping',
        data: {
          timestamp: new Date().toISOString(),
        },
      })),
    );

    return concat(initial$, merge(live$, heartbeat$)).pipe(
      takeUntil(disconnect$),
      finalize(() => {
        this.logger.log(`Closed progress stream for videoId=${videoId}`);
      }),
    );
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
      categoryId: dto.categoryId,
      tagIds: dto.tagIds,
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
      limit: this.parseLimit(limit),
    });
    return apiResponseContract(rows.map((row) => this.toVideoListItemDto(row)));
  }

  @Get('library/purchased')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiSuccessResponse(VideoListItemResponseDto, { isArray: true })
  async purchased(
    @CurrentUserId() userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<VideoListItemResponseDto[]>> {
    const result = await this.getPurchasedVideosUseCase.execute({
      userId,
      page: this.parsePage(page),
      limit: this.parseLimit(limit),
    });

    return ApiResponse.success(
      result.items.map((row) => this.toVideoListItemDto(row)),
      undefined,
      result.pagination,
    );
  }

  @Get('discovery/by-category')
  @SkipInternalGatewayGuard()
  @ApiQuery({ name: 'category', required: true })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiSuccessResponse(VideoListItemResponseDto, { isArray: true })
  async byCategory(
    @Query('category') category: string,
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

  @Get('discovery/subscribed')
  @ApiOperation({
    summary:
      'Get recent public videos from channels where the current user has an active membership',
    description:
      'This discovery feed is membership-backed and does not replace the memberships list API. It returns videos only and does not include tier, expiry, renewal, or upgrade metadata.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiSuccessResponse(VideoListItemResponseDto, { isArray: true })
  async subscribed(
    @CurrentUserId() userId: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<VideoListItemResponseDto[]>> {
    const rows = await this.getSubscribedVideosUseCase.execute({
      userId,
      limit: this.parseLimit(limit),
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
      limit: this.parseLimit(limit),
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
      category: video.category,
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

  private toStudioVideoListItemDto(
    video: StudioVideoListItemResponse,
  ): StudioVideoListItemResponseDto {
    return {
      id: video.id,
      channelId: video.channelId,
      title: video.title,
      description: video.description,
      category: video.category,
      tags: video.tags,
      status: video.status,
      visibility: video.visibility,
      price: video.price,
      requiredTierLevel: video.requiredTierLevel,
      thumbnailUrl: video.thumbnailUrl,
      durationSeconds: video.durationSeconds,
      resolutions: video.resolutions,
      errorMessage: video.errorMessage,
      viewCount: video.viewCount,
      publishedAt: video.publishedAt?.toISOString() ?? null,
      isDeleted: video.isDeleted,
      deletedAt: video.deletedAt?.toISOString() ?? null,
      deletedBy: video.deletedBy,
      deleteReason: video.deleteReason,
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
      categoryId: metadata.categoryId,
      category: metadata.category,
      tagIds: metadata.tagIds,
      tags: metadata.tags,
      thumbnailUrl: metadata.thumbnailUrl,
      viewCount: metadata.viewCount,
      status: metadata.status,
      visibility: metadata.visibility,
      errorMessage: metadata.errorMessage,
      publishedAt: metadata.publishedAt?.toISOString() ?? null,
      isDeleted: metadata.isDeleted,
      deletedAt: metadata.deletedAt?.toISOString() ?? null,
      deletedBy: metadata.deletedBy,
      deleteReason: metadata.deleteReason,
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

  private toVideoProgressDto(
    snapshot: VideoProgressSnapshot,
  ): VideoProgressResponseDto {
    return {
      videoId: snapshot.videoId,
      stage: snapshot.stage,
      percent: snapshot.percent,
      message: snapshot.message,
      terminal: snapshot.terminal,
      updatedAt: snapshot.updatedAt,
      detail: snapshot.detail ?? null,
      errorCode: snapshot.errorCode ?? null,
    };
  }

  private toSseMessage(
    type: string,
    snapshot: VideoProgressSnapshot,
  ): MessageEvent {
    return {
      type,
      data: this.toVideoProgressDto(snapshot),
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

  private parseLimit(limit?: string): number {
    const parsed = Number(limit) || 20;
    return Math.min(Math.max(parsed, 1), 50);
  }

  private parseTags(tags?: string): string[] | undefined {
    if (!tags) {
      return undefined;
    }

    const normalizedTags = [
      ...new Set(
        tags
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ];

    return normalizedTags.length > 0 ? normalizedTags : undefined;
  }

  private parsePage(page?: string): number {
    const parsed = Number(page) || 1;
    return Math.max(parsed, 1);
  }

  private parseStatuses(status?: string): VideoStatus[] | undefined {
    if (!status) {
      return undefined;
    }

    return status
      .split(',')
      .map((value) => value.trim())
      .filter((value): value is VideoStatus =>
        Object.values(VideoStatus).includes(value as VideoStatus),
      );
  }

  private parseVisibilities(
    visibility?: string,
  ): VideoVisibility[] | undefined {
    if (!visibility) {
      return undefined;
    }

    return visibility
      .split(',')
      .map((value) => value.trim())
      .filter((value): value is VideoVisibility =>
        Object.values(VideoVisibility).includes(value as VideoVisibility),
      );
  }
}
