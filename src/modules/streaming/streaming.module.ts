import { Module } from '@nestjs/common';
import { VideosModule } from '../videos/videos.module';
import { GetStreamMasterPlaylistUseCase } from './application/use-cases/get-stream-master-playlist.use-case';
import { StreamVideoSegmentUseCase } from './application/use-cases/stream-video-segment.use-case';
import { StreamingController } from './presentation/controllers/streaming.controller';

@Module({
  imports: [VideosModule],
  controllers: [StreamingController],
  providers: [GetStreamMasterPlaylistUseCase, StreamVideoSegmentUseCase],
})
export class StreamingModule {}
