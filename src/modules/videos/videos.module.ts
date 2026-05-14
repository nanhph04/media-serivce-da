import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesModule } from '../categories/categories.module';
import { ChannelsModule } from '../channels/channels.module';
import { EngagementModule } from '../engagement/engagement.module';
import { TagsModule } from '../tags/tags.module';
import { ConfirmVideoUploadUseCase } from './application/use-cases/confirm-video-upload.use-case';
import { CancelVideoUploadUseCase } from './application/use-cases/cancel-video-upload.use-case';
import { CheckStaleVideoProcessingUseCase } from './application/use-cases/check-stale-video-processing.use-case';
import { CleanupExpiredDraftUploadsUseCase } from './application/use-cases/cleanup-expired-draft-uploads.use-case';
import { DeleteFailedVideoUseCase } from './application/use-cases/delete-failed-video.use-case';
import { GetContinueWatchingUseCase } from './application/use-cases/get-continue-watching.use-case';
import { GetLatestVideosUseCase } from './application/use-cases/get-latest-videos.use-case';
import { GetPurchasedVideosUseCase } from './application/use-cases/get-purchased-videos.use-case';
import { GetStudioVideosUseCase } from './application/use-cases/get-studio-videos.use-case';
import { GetSubscribedVideosUseCase } from './application/use-cases/get-subscribed-videos.use-case';
import { GetVideoMetadataUseCase } from './application/use-cases/get-video-metadata.use-case';
import { GetVideosByCategoryUseCase } from './application/use-cases/get-videos-by-category.use-case';
import { HandleVideoProcessedFailedUseCase } from './application/use-cases/handle-video-processed-failed.use-case';
import { HandleVideoProcessedSuccessUseCase } from './application/use-cases/handle-video-processed-success.use-case';
import { HandleVideoModerationCompletedUseCase } from './application/use-cases/handle-video-moderation-completed.use-case';
import { HandleVideoPaymentSuccessUseCase } from './application/use-cases/handle-video-payment-success.use-case';
import { HandleVideoViewedUseCase } from './application/use-cases/handle-video-viewed.use-case';
import { InitVideoUploadUseCase } from './application/use-cases/init-video-upload.use-case';
import { PlayVideoUseCase } from './application/use-cases/play-video.use-case';
import { RefreshPlaybackTokenUseCase } from './application/use-cases/refresh-playback-token.use-case';
import { ReplaceVideoUploadUseCase } from './application/use-cases/replace-video-upload.use-case';
import { SearchPublicVideosUseCase } from './application/use-cases/search-public-videos.use-case';
import { FlushPendingVideoViewsUseCase } from './application/use-cases/flush-pending-video-views.use-case';
import { UpdateVideoProgressUseCase } from './application/use-cases/update-video-progress.use-case';
import { UpdateVideoMetadataUseCase } from './application/use-cases/update-video-metadata.use-case';
import { UnpublishVideoUseCase } from './application/use-cases/unpublish-video.use-case';
import { UnlockVideoUseCase } from './application/use-cases/unlock-video.use-case';
import { VideoWatchAccessService } from './application/services/video-watch-access.service';
import { VideoProcessingConsumer } from './infrastructure/consumers/video-processing.consumer';
import { VideoProgressConsumer } from './infrastructure/consumers/video-progress.consumer';
import { VideoModerationConsumer } from './infrastructure/consumers/video-moderation.consumer';
import { VideoPaymentConsumer } from './infrastructure/consumers/video-payment.consumer';
import { VideoViewedConsumer } from './infrastructure/consumers/video-viewed.consumer';
import { VideoViewFlushWorker } from './infrastructure/queue/video-view-flush.worker';
import { VideoDraftUploadCleanupWorker } from './infrastructure/queue/video-draft-upload-cleanup.worker';
import { VideoProcessingWatchdogWorker } from './infrastructure/queue/video-processing-watchdog.worker';
import { VideoModerationRequestPublisher } from './infrastructure/messaging/video-moderation-request.publisher';
import { VideoModerationOutcomePublisher } from './infrastructure/messaging/video-moderation-outcome.publisher';
import { VideoWorkerHealthCheckerService } from './infrastructure/health/video-worker-health-checker.service';
import { VideoWatchdogHealthFailureStore } from './infrastructure/health/video-watchdog-health-failure-store.service';
import { VideoCacheInvalidator } from './infrastructure/cache/video-cache-invalidator.service';
import { VideoViewAggregationService } from './infrastructure/cache/video-view-aggregation.service';
import { VideoPurchaseUnlockOrmEntity } from './infrastructure/persistence/video-purchase-unlock.orm-entity';
import { VideoCategoryOrmEntity } from './infrastructure/persistence/video-category.orm-entity';
import { VideoPurchaseUnlockRepository } from './infrastructure/persistence/video-purchase-unlock.repository';
import { VideoTagOrmEntity } from './infrastructure/persistence/video-tag.orm-entity';
import { VideoOrmEntity } from './infrastructure/persistence/video.orm-entity';
import { VideoRepository } from './infrastructure/persistence/video.repository';
import { VideoWatchProgressOrmEntity } from './infrastructure/persistence/video-watch-progress.orm-entity';
import { VideoWatchProgressRepository } from './infrastructure/persistence/video-watch-progress.repository';
import { VideoQueryService } from './infrastructure/query/video-query.service';
import { VideoProgressStoreService } from './infrastructure/progress/video-progress-store.service';
import { VideoProgressStreamService } from './infrastructure/progress/video-progress-stream.service';
import { VideosController } from './presentation/controllers/videos.controller';
import { CategoryVideosController } from './presentation/controllers/category-videos.controller';
import { VIDEO_CACHE_INVALIDATOR } from './application/interfaces/video-cache-invalidator.interface';
import { VIDEO_MODERATION_REQUEST_PUBLISHER } from './application/interfaces/video-moderation-request-publisher.interface';
import { VIDEO_MODERATION_OUTCOME_PUBLISHER } from './application/interfaces/video-moderation-outcome-publisher.interface';
import { VIDEO_QUERY_SERVICE } from './application/interfaces/video-query.service.interface';
import { VIDEO_PROGRESS_STORE } from './application/interfaces/video-progress-store.interface';
import { VIDEO_PROGRESS_STREAM } from './application/interfaces/video-progress-stream.interface';
import { VIDEO_SEARCH_QUERY_SERVICE } from './application/interfaces/video-search-query.service.interface';
import { VIDEO_VIEW_AGGREGATION } from './application/interfaces/video-view-aggregation.interface';
import { VIDEO_WATCHDOG_HEALTH_FAILURE_STORE } from './application/interfaces/video-watchdog-health-failure-store.interface';
import { VIDEO_WORKER_HEALTH_CHECKER } from './application/interfaces/video-worker-health-checker.interface';
import { VIDEO_PURCHASE_UNLOCK_REPOSITORY } from './domain/repositories/video-purchase-unlock.repository';
import { VIDEO_REPOSITORY } from './domain/repositories/video.repository';
import { VIDEO_WATCH_PROGRESS_REPOSITORY } from './domain/repositories/video-watch-progress.repository';
import { VideoProgressService } from './application/services/video-progress.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VideoOrmEntity,
      VideoCategoryOrmEntity,
      VideoTagOrmEntity,
      VideoPurchaseUnlockOrmEntity,
      VideoWatchProgressOrmEntity,
    ]),
    CategoriesModule,
    TagsModule,
    forwardRef(() => ChannelsModule),
    EngagementModule,
  ],
  controllers: [VideosController, CategoryVideosController],
  providers: [
    VideoRepository,
    VideoPurchaseUnlockRepository,
    VideoWatchProgressRepository,
    VideoQueryService,
    VideoCacheInvalidator,
    VideoViewAggregationService,
    VideoWatchAccessService,
    VideoProgressStoreService,
    VideoProgressStreamService,
    VideoProgressService,
    InitVideoUploadUseCase,
    ConfirmVideoUploadUseCase,
    ReplaceVideoUploadUseCase,
    CancelVideoUploadUseCase,
    DeleteFailedVideoUseCase,
    CheckStaleVideoProcessingUseCase,
    CleanupExpiredDraftUploadsUseCase,
    PlayVideoUseCase,
    UpdateVideoProgressUseCase,
    RefreshPlaybackTokenUseCase,
    SearchPublicVideosUseCase,
    UnpublishVideoUseCase,
    UnlockVideoUseCase,
    GetContinueWatchingUseCase,
    GetVideoMetadataUseCase,
    UpdateVideoMetadataUseCase,
    GetLatestVideosUseCase,
    GetPurchasedVideosUseCase,
    GetStudioVideosUseCase,
    GetVideosByCategoryUseCase,
    GetSubscribedVideosUseCase,
    HandleVideoProcessedSuccessUseCase,
    HandleVideoProcessedFailedUseCase,
    HandleVideoModerationCompletedUseCase,
    HandleVideoPaymentSuccessUseCase,
    HandleVideoViewedUseCase,
    FlushPendingVideoViewsUseCase,
    VideoProcessingConsumer,
    VideoProgressConsumer,
    VideoModerationConsumer,
    VideoPaymentConsumer,
    VideoViewedConsumer,
    VideoViewFlushWorker,
    VideoDraftUploadCleanupWorker,
    VideoProcessingWatchdogWorker,
    VideoModerationRequestPublisher,
    VideoModerationOutcomePublisher,
    VideoWorkerHealthCheckerService,
    VideoWatchdogHealthFailureStore,
    {
      provide: VIDEO_REPOSITORY,
      useExisting: VideoRepository,
    },
    {
      provide: VIDEO_PURCHASE_UNLOCK_REPOSITORY,
      useExisting: VideoPurchaseUnlockRepository,
    },
    {
      provide: VIDEO_WATCH_PROGRESS_REPOSITORY,
      useExisting: VideoWatchProgressRepository,
    },
    {
      provide: VIDEO_QUERY_SERVICE,
      useExisting: VideoQueryService,
    },
    {
      provide: VIDEO_SEARCH_QUERY_SERVICE,
      useExisting: VideoQueryService,
    },
    {
      provide: VIDEO_CACHE_INVALIDATOR,
      useExisting: VideoCacheInvalidator,
    },
    {
      provide: VIDEO_VIEW_AGGREGATION,
      useExisting: VideoViewAggregationService,
    },
    {
      provide: VIDEO_PROGRESS_STORE,
      useExisting: VideoProgressStoreService,
    },
    {
      provide: VIDEO_PROGRESS_STREAM,
      useExisting: VideoProgressStreamService,
    },
    {
      provide: VIDEO_MODERATION_REQUEST_PUBLISHER,
      useExisting: VideoModerationRequestPublisher,
    },
    {
      provide: VIDEO_MODERATION_OUTCOME_PUBLISHER,
      useExisting: VideoModerationOutcomePublisher,
    },
    {
      provide: VIDEO_WORKER_HEALTH_CHECKER,
      useExisting: VideoWorkerHealthCheckerService,
    },
    {
      provide: VIDEO_WATCHDOG_HEALTH_FAILURE_STORE,
      useExisting: VideoWatchdogHealthFailureStore,
    },
  ],
  exports: [
    VIDEO_REPOSITORY,
    VIDEO_QUERY_SERVICE,
    VIDEO_SEARCH_QUERY_SERVICE,
    VIDEO_WATCH_PROGRESS_REPOSITORY,
  ],
})
export class VideosModule {}
