import { Module } from '@nestjs/common';
import { EngagementModule } from '../engagement/engagement.module';
import { VideosModule } from '../videos/videos.module';
import { StreamingApplicationService } from './application/streaming.application.service';
import { StreamingController } from './presentation/controllers/streaming.controller';

@Module({
  imports: [VideosModule, EngagementModule],
  controllers: [StreamingController],
  providers: [StreamingApplicationService],
})
export class StreamingModule {}
