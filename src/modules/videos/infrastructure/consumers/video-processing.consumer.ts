import { Injectable, OnModuleInit } from '@nestjs/common';
import { VideoApplicationService } from '../../application/video.application.service';

@Injectable()
export class VideoProcessingConsumer implements OnModuleInit {
  constructor(
    private readonly videoApplicationService: VideoApplicationService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.videoApplicationService.handleProcessingEvents();
  }
}
