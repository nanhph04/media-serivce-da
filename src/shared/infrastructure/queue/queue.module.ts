import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { VideoQueueService } from './video-queue.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [VideoQueueService],
  exports: [VideoQueueService],
})
export class QueueModule {}
