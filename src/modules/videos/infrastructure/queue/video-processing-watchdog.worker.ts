import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import { LoggerService } from '@shared/infrastructure/logger/logger.service';
import { CheckStaleVideoProcessingUseCase } from '../../application/use-cases/check-stale-video-processing.use-case';

interface VideoProcessingWatchdogJobData {
  triggeredAt: string;
}

@Injectable()
export class VideoProcessingWatchdogWorker
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly queue: Queue<VideoProcessingWatchdogJobData>;
  private readonly worker: Worker<VideoProcessingWatchdogJobData>;

  constructor(
    private readonly configService: ConfigService,
    private readonly checkStaleVideoProcessingUseCase: CheckStaleVideoProcessingUseCase,
    private readonly logger: LoggerService,
  ) {
    const connection = {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.getNumber('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.getNumber('REDIS_DB', 0),
    };

    this.queue = new Queue<VideoProcessingWatchdogJobData>(
      'video-processing-watchdog',
      { connection },
    );
    this.worker = new Worker<VideoProcessingWatchdogJobData>(
      'video-processing-watchdog',
      async () => {
        await this.checkStaleVideoProcessingUseCase.execute();
      },
      {
        connection,
        concurrency: 1,
      },
    );

    this.logger.setContext(VideoProcessingWatchdogWorker.name);
    this.worker.on('failed', (job, error) => {
      this.logger.logError('Video processing watchdog job failed', error, {
        jobId: job?.id,
      });
    });
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.queue.add(
      'check-stale-video-processing',
      { triggeredAt: new Date().toISOString() },
      {
        jobId: 'check-stale-video-processing',
        repeat: {
          every: this.configService.getVideoWatchdogIntervalSeconds() * 1000,
        },
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
  }
}
