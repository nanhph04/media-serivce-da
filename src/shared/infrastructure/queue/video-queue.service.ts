import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ConfigService } from '../config/config.service';

export interface VideoProcessingJobPayload {
  videoId: string;
  rawFileKey: string;
  resolution: string[];
  userId: string;
}

@Injectable()
export class VideoQueueService implements OnModuleDestroy {
  private readonly queue: Queue<VideoProcessingJobPayload>;

  constructor(private readonly configService: ConfigService) {
    this.queue = new Queue<VideoProcessingJobPayload>(
      this.configService.get<string>('BULLMQ_QUEUE_NAME', 'video-processing'),
      {
        connection: {
          host: this.configService.get<string>('REDIS_HOST', 'localhost'),
          port: this.configService.getNumber('REDIS_PORT', 6379),
          password: this.configService.get<string>('REDIS_PASSWORD'),
          db: this.configService.getNumber('REDIS_DB', 0),
        },
      },
    );
  }

  async enqueueTranscodeJob(payload: VideoProcessingJobPayload): Promise<void> {
    await this.queue.add('transcode-job', payload, { attempts: 3 });
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }
}
