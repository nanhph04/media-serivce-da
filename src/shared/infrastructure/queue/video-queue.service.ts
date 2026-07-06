import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ConfigService } from '../config/config.service';
import type {
  IVideoProcessingJobDispatcher,
  VideoProcessingJobOptions,
  VideoProcessingJobPayload,
} from '../../application/interfaces/video-processing-job-dispatcher.interface';

const COMPLETED_TRANSCODE_JOB_RETENTION_SECONDS = 24 * 60 * 60;

@Injectable()
export class VideoQueueService
  implements OnModuleDestroy, IVideoProcessingJobDispatcher
{
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

  async enqueueTranscodeJob(
    payload: VideoProcessingJobPayload,
    options?: VideoProcessingJobOptions,
  ): Promise<void> {
    await this.queue.add('transcode-job', payload, {
      jobId: options?.jobId ?? this.createTranscodeJobId(payload.videoId),
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        age: COMPLETED_TRANSCODE_JOB_RETENTION_SECONDS,
        count: 1000,
      },
      removeOnFail: 100,
    });
  }

  private createTranscodeJobId(videoId: string): string {
    return `transcode-${videoId}`;
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }
}
