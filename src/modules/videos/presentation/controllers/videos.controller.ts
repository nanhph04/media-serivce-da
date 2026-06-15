import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiCreatedSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { ApiSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { CurrentRequestId } from '@shared/presentation/decorators/request-id.decorator';
import { CurrentUserId } from '@shared/presentation/decorators/user-id.decorator';
import { SkipInternalGatewayGuard } from '@shared/presentation/decorators/skip-internal-gateway.decorator';
import {
  ApiResponse,
  apiResponseContract,
} from '@shared/presentation/dto/api-response.dto';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';
import type { VideoVisibility } from '../../domain/entities/video.entity';
import { ConfirmVideoUploadUseCase } from '../../application/use-cases/confirm-video-upload.use-case';
import { GetContinueWatchingUseCase } from '../../application/use-cases/get-continue-watching.use-case';
import { GetLatestVideosUseCase } from '../../application/use-cases/get-latest-videos.use-case';
import { GetPurchasedVideosUseCase } from '../../application/use-cases/get-purchased-videos.use-case';
import { GetRankedVideosUseCase } from '../../application/use-cases/get-ranked-videos.use-case';
import { GetStudioVideoDetailUseCase } from '../../application/use-cases/get-studio-video-detail.use-case';
import { GetStudioVideosUseCase } from '../../application/use-cases/get-studio-videos.use-case';
import { GetSubscribedVideosUseCase } from '../../application/use-cases/get-subscribed-videos.use-case';
import { GetVideoMetadataUseCase } from '../../application/use-cases/get-video-metadata.use-case';
import { GenerateVideoMetadataSuggestionUseCase } from '../../application/use-cases/generate-video-metadata-suggestion.use-case';
import { GetVideosByCategoryUseCase } from '../../application/use-cases/get-videos-by-category.use-case';
import { StartVideoUploadUseCase } from '../../application/use-cases/start-video-upload.use-case';
import { CreateVideoUploadPartUrlsUseCase } from '../../application/use-cases/create-video-upload-part-urls.use-case';
import { RecordVideoUploadPartCompletedUseCase } from '../../application/use-cases/record-video-upload-part-completed.use-case';
import { GetVideoUploadStatusUseCase } from '../../application/use-cases/get-video-upload-status.use-case';
import { CompleteVideoUploadUseCase } from '../../application/use-cases/complete-video-upload.use-case';
import { PlayVideoUseCase } from '../../application/use-cases/play-video.use-case';
import { PurchaseVideoUseCase } from '../../application/use-cases/purchase-video.use-case';
import { RefreshPlaybackTokenUseCase } from '../../application/use-cases/refresh-playback-token.use-case';
import { SearchPublicVideosUseCase } from '../../application/use-cases/search-public-videos.use-case';
import { UpdateVideoProgressUseCase } from '../../application/use-cases/update-video-progress.use-case';
import { UpdateVideoMetadataUseCase } from '../../application/use-cases/update-video-metadata.use-case';
import { UnpublishVideoUseCase } from '../../application/use-cases/unpublish-video.use-case';
import { CancelVideoUploadUseCase } from '../../application/use-cases/cancel-video-upload.use-case';
import { DeleteFailedVideoUseCase } from '../../application/use-cases/delete-failed-video.use-case';
import { ConfirmVideoUploadRequestDto } from '../dtos/confirm-video-upload.request';
import { ConfirmVideoUploadResponseDto } from '../dtos/confirm-video-upload.response';
import { ContinueWatchingItemResponseDto } from '../dtos/continue-watching-item.response';
import { GenerateVideoMetadataSuggestionRequestDto } from '../dtos/generate-video-metadata-suggestion.request';
import { GenerateVideoMetadataSuggestionResponseDto } from '../dtos/generate-video-metadata-suggestion.response';
import { StartVideoUploadRequestDto } from '../dtos/start-video-upload.request';
import { StartVideoUploadResponseDto } from '../dtos/start-video-upload.response';
import {
  CreateVideoUploadPartUrlsRequestDto,
  RecordVideoUploadPartCompletedRequestDto,
} from '../dtos/video-upload-session.request';
import {
  CompleteVideoUploadResponseDto,
  VideoUploadPartCompletedResponseDto,
  VideoUploadPartUrlsResponseDto,
  VideoUploadStatusResponseDto,
} from '../dtos/video-upload-session.response';
import { CancelVideoUploadResponseDto } from '../dtos/cancel-video-upload.response';
import { DeleteFailedVideoResponseDto } from '../dtos/delete-failed-video.response';
import { PlayVideoResponseDto } from '../dtos/play-video.response';
import { PurchaseVideoResponseDto } from '../dtos/purchase-video.response';
import { PurchasedVideoResponseDto } from '../dtos/purchased-video.response';
import { RankedVideoListItemResponseDto } from '../dtos/ranked-video-list-item.response';
import { RefreshPlaybackTokenResponseDto } from '../dtos/refresh-playback-token.response';
import { UpdateVideoMetadataRequestDto } from '../dtos/update-video-metadata.request';
import { UpdateVideoProgressRequestDto } from '../dtos/update-video-progress.request';
import { UpdateVideoProgressResponseDto } from '../dtos/update-video-progress.response';
import { UnpublishVideoResponseDto } from '../dtos/unpublish-video.response';
import { StudioVideoListItemResponseDto } from '../dtos/studio-video-list-item.response';
import { VideoListItemResponseDto } from '../dtos/video-list-item.response';
import { VideoMetadataResponseDto } from '../dtos/video-metadata.response';
import {
  parseVideoLimit,
  parseVideoPage,
  parseVideoRankingMetric,
  parseVideoRankingPeriod,
  parseVideoStatuses,
  parseVideoTags,
  parseVideoVisibilities,
} from '../dtos/video-query-parser';

@ApiTags('videos')
@ApiHeader({ name: 'x-user-id', required: true })
@UseGuards(InternalGatewayGuard)
@Controller()
export class VideosController {
  constructor(
    private readonly confirmVideoUploadUseCase: ConfirmVideoUploadUseCase,
    private readonly cancelVideoUploadUseCase: CancelVideoUploadUseCase,
    private readonly deleteFailedVideoUseCase: DeleteFailedVideoUseCase,
    private readonly playVideoUseCase: PlayVideoUseCase,
    private readonly purchaseVideoUseCase: PurchaseVideoUseCase,
    private readonly updateVideoProgressUseCase: UpdateVideoProgressUseCase,
    private readonly refreshPlaybackTokenUseCase: RefreshPlaybackTokenUseCase,
    private readonly getContinueWatchingUseCase: GetContinueWatchingUseCase,
    private readonly getLatestVideosUseCase: GetLatestVideosUseCase,
    private readonly getPurchasedVideosUseCase: GetPurchasedVideosUseCase,
    private readonly getRankedVideosUseCase: GetRankedVideosUseCase,
    private readonly getStudioVideoDetailUseCase: GetStudioVideoDetailUseCase,
    private readonly getStudioVideosUseCase: GetStudioVideosUseCase,
    private readonly getVideosByCategoryUseCase: GetVideosByCategoryUseCase,
    private readonly getSubscribedVideosUseCase: GetSubscribedVideosUseCase,
    private readonly getVideoMetadataUseCase: GetVideoMetadataUseCase,
    private readonly generateVideoMetadataSuggestionUseCase: GenerateVideoMetadataSuggestionUseCase,
    private readonly updateVideoMetadataUseCase: UpdateVideoMetadataUseCase,
    private readonly unpublishVideoUseCase: UnpublishVideoUseCase,
    private readonly searchPublicVideosUseCase: SearchPublicVideosUseCase,
    private readonly startVideoUploadUseCase: StartVideoUploadUseCase,
    private readonly createVideoUploadPartUrlsUseCase: CreateVideoUploadPartUrlsUseCase,
    private readonly recordVideoUploadPartCompletedUseCase: RecordVideoUploadPartCompletedUseCase,
    private readonly getVideoUploadStatusUseCase: GetVideoUploadStatusUseCase,
    private readonly completeVideoUploadUseCase: CompleteVideoUploadUseCase,
  ) {}

  @Get('studio/videos')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'visibility', required: false, type: String })
  @ApiSuccessResponse(StudioVideoListItemResponseDto, { isArray: true })
  async studioVideos(
    @CurrentUserId() userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('visibility') visibility?: string,
  ): Promise<ApiResponse<StudioVideoListItemResponseDto[]>> {
    const rows = await this.getStudioVideosUseCase.execute({
      userId,
      page: parseVideoPage(page),
      limit: parseVideoLimit(limit),
      statuses: parseVideoStatuses(status),
      visibilities: parseVideoVisibilities(visibility),
    });

    return ApiResponse.success(
      rows.items.map((row) =>
        StudioVideoListItemResponseDto.fromApplicationDto(row),
      ),
      undefined,
      rows.pagination,
    );
  }

  @Get('studio/videos/:id')
  @ApiOperation({
    summary: 'Get the current user studio video detail for any video status',
  })
  @ApiSuccessResponse(StudioVideoListItemResponseDto)
  async studioVideoDetail(
    @CurrentUserId() userId: string,
    @Param('id') videoId: string,
  ): Promise<ApiResponse<StudioVideoListItemResponseDto>> {
    const video = await this.getStudioVideoDetailUseCase.execute({
      userId,
      videoId,
    });

    return apiResponseContract(
      StudioVideoListItemResponseDto.fromApplicationDto(video),
    );
  }

  @Post('studio/videos/uploads')
  @ApiOperation({
    summary: 'Create a draft video and start a resumable multipart upload',
  })
  @ApiCreatedSuccessResponse(StartVideoUploadResponseDto)
  async startUpload(
    @CurrentUserId() userId: string,
    @Body() dto: StartVideoUploadRequestDto,
  ): Promise<ApiResponse<StartVideoUploadResponseDto>> {
    return apiResponseContract(
      await this.startVideoUploadUseCase.execute({
        userId,
        title: dto.title,
        description: dto.description,
        categoryId: dto.categoryId,
        tagIds: dto.tagIds,
        visibility: dto.visibility as VideoVisibility,
        price: dto.price,
        requiredTierLevel: dto.requiredTierLevel ?? null,
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        fileLastModified: new Date(dto.fileLastModified),
        thumbnailExtension: dto.thumbnailExtension,
      }),
    );
  }

  @Post('studio/videos/:videoId/uploads/:uploadId/part-urls')
  @ApiSuccessResponse(VideoUploadPartUrlsResponseDto)
  async createUploadPartUrls(
    @CurrentUserId() userId: string,
    @Param('videoId') videoId: string,
    @Param('uploadId') uploadId: string,
    @Body() dto: CreateVideoUploadPartUrlsRequestDto,
  ): Promise<ApiResponse<VideoUploadPartUrlsResponseDto>> {
    return apiResponseContract(
      await this.createVideoUploadPartUrlsUseCase.execute({
        userId,
        videoId,
        uploadId,
        partNumbers: dto.partNumbers,
      }),
    );
  }

  @Post('studio/videos/:videoId/uploads/:uploadId/parts/:partNumber/completed')
  @ApiSuccessResponse(VideoUploadPartCompletedResponseDto)
  async recordUploadPartCompleted(
    @CurrentUserId() userId: string,
    @Param('videoId') videoId: string,
    @Param('uploadId') uploadId: string,
    @Param('partNumber') partNumber: string,
    @Body() dto: RecordVideoUploadPartCompletedRequestDto,
  ): Promise<ApiResponse<VideoUploadPartCompletedResponseDto>> {
    return apiResponseContract(
      await this.recordVideoUploadPartCompletedUseCase.execute({
        userId,
        videoId,
        uploadId,
        partNumber: Number(partNumber),
        etag: dto.etag,
        sizeBytes: dto.sizeBytes,
      }),
    );
  }

  @Get('studio/videos/:videoId/uploads/:uploadId/status')
  @ApiSuccessResponse(VideoUploadStatusResponseDto)
  async uploadStatus(
    @CurrentUserId() userId: string,
    @Param('videoId') videoId: string,
    @Param('uploadId') uploadId: string,
  ): Promise<ApiResponse<VideoUploadStatusResponseDto>> {
    return apiResponseContract(
      await this.getVideoUploadStatusUseCase.execute({
        userId,
        videoId,
        uploadId,
      }),
    );
  }

  @Post('studio/videos/:videoId/uploads/:uploadId/complete')
  @ApiSuccessResponse(CompleteVideoUploadResponseDto)
  async completeUpload(
    @CurrentUserId() userId: string,
    @Param('videoId') videoId: string,
    @Param('uploadId') uploadId: string,
  ): Promise<ApiResponse<CompleteVideoUploadResponseDto>> {
    return apiResponseContract(
      await this.completeVideoUploadUseCase.execute({
        userId,
        videoId,
        uploadId,
      }),
    );
  }

  @Get('videos')
  @SkipInternalGatewayGuard()
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'tags', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiSuccessResponse(VideoListItemResponseDto, { isArray: true })
  async searchVideos(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('tags') tags?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<VideoListItemResponseDto[]>> {
    const rows = await this.searchPublicVideosUseCase.execute({
      q,
      category,
      tags: parseVideoTags(tags),
      page: parseVideoPage(page),
      limit: parseVideoLimit(limit),
    });

    return ApiResponse.success(
      rows.items.map((row) => VideoListItemResponseDto.fromApplicationDto(row)),
      undefined,
      rows.pagination,
    );
  }

  @Post('studio/videos/:videoId/uploads/:uploadId/submit')
  @ApiCreatedSuccessResponse(ConfirmVideoUploadResponseDto)
  async submitUpload(
    @CurrentUserId() userId: string,
    @Param('videoId') videoId: string,
    @Body() dto: ConfirmVideoUploadRequestDto,
  ): Promise<ApiResponse<ConfirmVideoUploadResponseDto>> {
    return apiResponseContract(
      await this.confirmVideoUploadUseCase.execute({
        userId,
        videoId,
        resolutions: dto.resolutions,
        thumbnailObjectKey: dto.thumbnailObjectKey,
      }),
    );
  }

  @Delete('studio/videos/:videoId/uploads/:uploadId')
  @ApiSuccessResponse(CancelVideoUploadResponseDto)
  async cancelMultipartUpload(
    @CurrentUserId() userId: string,
    @Param('videoId') videoId: string,
    @Param('uploadId') uploadId: string,
  ): Promise<ApiResponse<CancelVideoUploadResponseDto>> {
    return apiResponseContract(
      await this.cancelVideoUploadUseCase.execute({
        userId,
        videoId,
        uploadId,
      }),
    );
  }

  @Delete('studio/videos/:id/failed-upload')
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

  @Delete('studio/videos/:id')
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

  @Get('me/videos/:id/play')
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

  @Post('videos/:id/purchase')
  @ApiCreatedSuccessResponse(PurchaseVideoResponseDto)
  async purchaseVideo(
    @CurrentUserId() userId: string,
    @CurrentRequestId() traceId: string,
    @Param('id') videoId: string,
  ): Promise<ApiResponse<PurchaseVideoResponseDto>> {
    const response = await this.purchaseVideoUseCase.execute({
      userId,
      traceId,
      videoId,
    });

    return apiResponseContract(
      PurchaseVideoResponseDto.fromApplicationDto(response),
    );
  }

  @Post('me/videos/:id/progress')
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

    return apiResponseContract(
      UpdateVideoProgressResponseDto.fromApplicationDto(response),
    );
  }

  @Post('me/videos/:id/playback-token/refresh')
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

  @Get('videos/:id/metadata')
  @SkipInternalGatewayGuard()
  @ApiSuccessResponse(VideoMetadataResponseDto)
  async getMetadata(
    @Param('id') videoId: string,
    @Headers('x-user-id') viewerUserId?: string,
  ): Promise<ApiResponse<VideoMetadataResponseDto>> {
    const metadata = await this.getVideoMetadataUseCase.execute({
      videoId,
      viewerUserId,
    });
    return apiResponseContract(
      VideoMetadataResponseDto.fromApplicationDto(metadata),
    );
  }

  @Post('studio/videos/metadata-suggestions')
  @ApiHeader({ name: 'x-internal-secret', required: true })
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiSuccessResponse(GenerateVideoMetadataSuggestionResponseDto)
  async generateMetadataSuggestion(
    @CurrentUserId() userId: string,
    @CurrentRequestId() traceId: string,
    @Body() dto: GenerateVideoMetadataSuggestionRequestDto,
  ): Promise<ApiResponse<GenerateVideoMetadataSuggestionResponseDto>> {
    const suggestion =
      await this.generateVideoMetadataSuggestionUseCase.execute({
        userId,
        traceId,
        title: dto.title,
        description: dto.description,
        categoryId: dto.categoryId,
        tagIds: dto.tagIds,
        language: dto.language,
        tone: dto.tone,
        maxDescriptionLength: dto.maxDescriptionLength,
      });

    return apiResponseContract(
      GenerateVideoMetadataSuggestionResponseDto.fromApplicationDto(suggestion),
    );
  }

  @Patch('studio/videos/:id/metadata')
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
      visibility: dto.visibility,
      price: dto.price,
      requiredTierLevel: dto.requiredTierLevel,
    });
    return apiResponseContract(
      VideoMetadataResponseDto.fromApplicationDto(metadata),
    );
  }

  @Get('videos/latest')
  @SkipInternalGatewayGuard()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiSuccessResponse(VideoListItemResponseDto, { isArray: true })
  async latest(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<VideoListItemResponseDto[]>> {
    const rows = await this.getLatestVideosUseCase.execute({
      page: parseVideoPage(page),
      limit: parseVideoLimit(limit),
    });
    return ApiResponse.success(
      rows.items.map((row) => VideoListItemResponseDto.fromApplicationDto(row)),
      undefined,
      rows.pagination,
    );
  }

  @Get('videos/ranking')
  @SkipInternalGatewayGuard()
  @ApiQuery({ name: 'metric', required: true, enum: ['views', 'purchases'] })
  @ApiQuery({ name: 'period', required: true, enum: ['day', 'week', 'month'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiSuccessResponse(RankedVideoListItemResponseDto, { isArray: true })
  async ranking(
    @Query('metric') metric?: string,
    @Query('period') period?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<RankedVideoListItemResponseDto[]>> {
    const result = await this.getRankedVideosUseCase.execute({
      metric: parseVideoRankingMetric(metric),
      period: parseVideoRankingPeriod(period),
      page: parseVideoPage(page),
      limit: parseVideoLimit(limit),
    });

    return ApiResponse.success(
      result.items.map((row) =>
        RankedVideoListItemResponseDto.fromApplicationDto(row),
      ),
      undefined,
      result.pagination,
    );
  }

  @Get('me/videos/purchased')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiSuccessResponse(PurchasedVideoResponseDto, { isArray: true })
  async purchased(
    @CurrentUserId() userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<PurchasedVideoResponseDto[]>> {
    const result = await this.getPurchasedVideosUseCase.execute({
      userId,
      page: parseVideoPage(page),
      limit: parseVideoLimit(limit),
    });

    return ApiResponse.success(
      result.items.map((row) =>
        PurchasedVideoResponseDto.fromApplicationDto(row),
      ),
      undefined,
      result.pagination,
    );
  }

  @Get('videos/by-category')
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

  @Get('me/videos/subscribed')
  @ApiOperation({
    summary:
      'Get recent public videos from channels where the current user has an active membership',
    description:
      'This discovery feed is membership-backed and does not replace the memberships list API. It returns videos only and does not include tier, expiry, renewal, or upgrade metadata.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiSuccessResponse(VideoListItemResponseDto, { isArray: true })
  async subscribed(
    @CurrentUserId() userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<VideoListItemResponseDto[]>> {
    const rows = await this.getSubscribedVideosUseCase.execute({
      userId,
      page: parseVideoPage(page),
      limit: parseVideoLimit(limit),
    });
    return ApiResponse.success(
      rows.items.map((row) => VideoListItemResponseDto.fromApplicationDto(row)),
      undefined,
      rows.pagination,
    );
  }

  @Get('me/videos/continue-watching')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiSuccessResponse(ContinueWatchingItemResponseDto, { isArray: true })
  async continueWatching(
    @CurrentUserId() userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<ContinueWatchingItemResponseDto[]>> {
    const rows = await this.getContinueWatchingUseCase.execute({
      userId,
      page: parseVideoPage(page),
      limit: parseVideoLimit(limit),
    });
    return ApiResponse.success(
      rows.items.map((row) =>
        ContinueWatchingItemResponseDto.fromApplicationDto(row),
      ),
      undefined,
      rows.pagination,
    );
  }
}
