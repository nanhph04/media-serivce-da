import { Module } from '@nestjs/common';
import { EngagementModule } from '../engagement/engagement.module';
import { VideosModule } from '../videos/videos.module';
import { GetStreamMasterPlaylistUseCase } from './application/use-cases/get-stream-master-playlist.use-case';
import { StreamVideoSegmentUseCase } from './application/use-cases/stream-video-segment.use-case';
import { StreamingController } from './presentation/controllers/streaming.controller';

@Module({
  imports: [VideosModule, EngagementModule],
  controllers: [StreamingController],
  providers: [GetStreamMasterPlaylistUseCase, StreamVideoSegmentUseCase],
})
export class StreamingModule {}
