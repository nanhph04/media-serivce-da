import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import { LoggerService } from '@shared/infrastructure/logger/logger.service';
import { FlushPendingVideoViewsUseCase } from '../../application/use-cases/flush-pending-video-views.use-case';

interface FlushVideoViewsJobData {
  triggeredAt: string;
}

@Injectable()
export class VideoViewFlushWorker
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly queue: Queue<FlushVideoViewsJobData>;
  private readonly worker: Worker<FlushVideoViewsJobData>;

  constructor(
    private readonly configService: ConfigService,
    private readonly flushPendingVideoViewsUseCase: FlushPendingVideoViewsUseCase,
    private readonly logger: LoggerService,
  ) {
    const connection = {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.getNumber('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.getNumber('REDIS_DB', 0),
    };

    this.queue = new Queue<FlushVideoViewsJobData>('video-view-flush', {
      connection,
    });
    this.worker = new Worker<FlushVideoViewsJobData>(
      'video-view-flush',
      async () => {
        await this.flushPendingVideoViewsUseCase.execute();
      },
      {
        connection,
        concurrency: 1,
      },
    );

    this.logger.setContext(VideoViewFlushWorker.name);
    this.worker.on('failed', (job, error) => {
      this.logger.logError('Video view flush job failed', error, {
        jobId: job?.id,
      });
    });
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.queue.add(
      'flush-video-views',
      { triggeredAt: new Date().toISOString() },
      {
        jobId: 'flush-video-views',
        repeat: {
          every:
            this.configService.getVideoViewFlushIntervalSeconds() * 1000,
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
