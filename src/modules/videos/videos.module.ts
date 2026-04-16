import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelsModule } from '../channels/channels.module';
import { EngagementModule } from '../engagement/engagement.module';
import { VideoApplicationService } from './application/video.application.service';
import { VideoQueryService } from './application/video-query.service';
import { VideoProcessingConsumer } from './infrastructure/consumers/video-processing.consumer';
import { VideoPurchaseUnlockOrmEntity } from './infrastructure/persistence/video-purchase-unlock.orm-entity';
import { VideoPurchaseUnlockRepository } from './infrastructure/persistence/video-purchase-unlock.repository';
import { VideoOrmEntity } from './infrastructure/persistence/video.orm-entity';
import { VideoRepository } from './infrastructure/persistence/video.repository';
import { VideosController } from './presentation/controllers/videos.controller';
import { VIDEO_QUERY_SERVICE } from './application/interfaces/video-query.service.interface';
import { VIDEO_PURCHASE_UNLOCK_REPOSITORY } from './domain/repositories/video-purchase-unlock.repository';
import { VIDEO_REPOSITORY } from './domain/repositories/video.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([VideoOrmEntity, VideoPurchaseUnlockOrmEntity]),
    forwardRef(() => ChannelsModule),
    EngagementModule,
  ],
  controllers: [VideosController],
  providers: [
    VideoRepository,
    VideoPurchaseUnlockRepository,
    VideoApplicationService,
    VideoQueryService,
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
  exports: [VideoApplicationService, VIDEO_REPOSITORY, VIDEO_QUERY_SERVICE],
})
export class VideosModule {}
