import { Module } from '@nestjs/common';
import { RecordVideoViewUseCase } from './application/use-cases/record-video-view.use-case';

@Module({
  providers: [RecordVideoViewUseCase],
  exports: [RecordVideoViewUseCase],
})
export class EngagementModule {}
