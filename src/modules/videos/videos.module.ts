import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesModule } from '../categories/categories.module';
import { ChannelsModule } from '../channels/channels.module';
import { EngagementModule } from '../engagement/engagement.module';
import { VideoQueryService } from './application/video-query.service';
import { ConfirmVideoUploadUseCase } from './application/use-cases/confirm-video-upload.use-case';
import { GetLatestVideosUseCase } from './application/use-cases/get-latest-videos.use-case';
import { GetSubscribedVideosUseCase } from './application/use-cases/get-subscribed-videos.use-case';
import { GetVideosByCategoryUseCase } from './application/use-cases/get-videos-by-category.use-case';
import { HandleVideoProcessedFailedUseCase } from './application/use-cases/handle-video-processed-failed.use-case';
import { HandleVideoProcessedSuccessUseCase } from './application/use-cases/handle-video-processed-success.use-case';
import { InitVideoUploadUseCase } from './application/use-cases/init-video-upload.use-case';
import { PlayVideoUseCase } from './application/use-cases/play-video.use-case';
import { UnlockVideoUseCase } from './application/use-cases/unlock-video.use-case';
import { VideoWatchAccessService } from './application/services/video-watch-access.service';
import { VideoProcessingConsumer } from './infrastructure/consumers/video-processing.consumer';
import { VideoPurchaseUnlockOrmEntity } from './infrastructure/persistence/video-purchase-unlock.orm-entity';
import { VideoCategoryOrmEntity } from './infrastructure/persistence/video-category.orm-entity';
import { VideoPurchaseUnlockRepository } from './infrastructure/persistence/video-purchase-unlock.repository';
import { VideoOrmEntity } from './infrastructure/persistence/video.orm-entity';
import { VideoRepository } from './infrastructure/persistence/video.repository';
import { VideosController } from './presentation/controllers/videos.controller';
import { VIDEO_QUERY_SERVICE } from './application/interfaces/video-query.service.interface';
import { VIDEO_PURCHASE_UNLOCK_REPOSITORY } from './domain/repositories/video-purchase-unlock.repository';
import { VIDEO_REPOSITORY } from './domain/repositories/video.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VideoOrmEntity,
      VideoCategoryOrmEntity,
      VideoPurchaseUnlockOrmEntity,
    ]),
    CategoriesModule,
    forwardRef(() => ChannelsModule),
    EngagementModule,
  ],
  controllers: [VideosController],
  providers: [
    VideoRepository,
    VideoPurchaseUnlockRepository,
    VideoQueryService,
    VideoWatchAccessService,
    InitVideoUploadUseCase,
    ConfirmVideoUploadUseCase,
    PlayVideoUseCase,
    UnlockVideoUseCase,
    GetLatestVideosUseCase,
    GetVideosByCategoryUseCase,
    GetSubscribedVideosUseCase,
    HandleVideoProcessedSuccessUseCase,
    HandleVideoProcessedFailedUseCase,
    VideoProcessingConsumer,
    {
      provide: VIDEO_REPOSITORY,
      useExisting: VideoRepository,
    },
    {
      provide: VIDEO_PURCHASE_UNLOCK_REPOSITORY,
      useExisting: VideoPurchaseUnlockRepository,
    },
    {
      provide: VIDEO_QUERY_SERVICE,
      useExisting: VideoQueryService,
    },
  ],
  exports: [VIDEO_REPOSITORY, VIDEO_QUERY_SERVICE],
})
export class VideosModule {}
