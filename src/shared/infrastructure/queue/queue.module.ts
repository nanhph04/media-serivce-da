import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { VideoQueueService } from './video-queue.service';
import { VIDEO_PROCESSING_JOB_DISPATCHER } from '../../application/interfaces/video-processing-job-dispatcher.interface';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    VideoQueueService,
    {
      provide: VIDEO_PROCESSING_JOB_DISPATCHER,
      useExisting: VideoQueueService,
    },
  ],
  exports: [VideoQueueService, VIDEO_PROCESSING_JOB_DISPATCHER],
})
export class QueueModule {}
