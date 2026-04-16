import { Module } from '@nestjs/common';
import { VideosModule } from '../videos/videos.module';
import { StreamingApplicationService } from './application/streaming.application.service';
import { StreamingController } from './presentation/controllers/streaming.controller';

@Module({
  imports: [VideosModule],
  controllers: [StreamingController],
  providers: [StreamingApplicationService],
})
export class StreamingModule {}
