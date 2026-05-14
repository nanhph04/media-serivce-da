import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import { LoggerService } from '@shared/infrastructure/logger/logger.service';
import { CleanupHardDeletedVideosUseCase } from '../../application/use-cases/cleanup-hard-deleted-videos.use-case';

interface HardDeleteCleanupJobData {
  triggeredAt: string;
}

@Injectable()
export class VideoHardDeleteCleanupWorker
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly queue: Queue<HardDeleteCleanupJobData>;
  private readonly worker: Worker<HardDeleteCleanupJobData>;

  constructor(
    private readonly configService: ConfigService,
    private readonly cleanupHardDeletedVideosUseCase: CleanupHardDeletedVideosUseCase,
    private readonly logger: LoggerService,
  ) {
    const connection = {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.getNumber('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.getNumber('REDIS_DB', 0),
    };

    this.queue = new Queue<HardDeleteCleanupJobData>(
      'video-hard-delete-cleanup',
      { connection },
    );
    this.worker = new Worker<HardDeleteCleanupJobData>(
      'video-hard-delete-cleanup',
      async () => {
        await this.cleanupHardDeletedVideosUseCase.execute();
      },
      {
        connection,
        concurrency: 1,
      },
    );

    this.logger.setContext(VideoHardDeleteCleanupWorker.name);
    this.worker.on('failed', (job, error) => {
      this.logger.logError('Video hard delete cleanup job failed', error, {
        jobId: job?.id,
      });
    });
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.queue.add(
      'cleanup-hard-deleted-videos',
      { triggeredAt: new Date().toISOString() },
      {
        jobId: 'cleanup-hard-deleted-videos',
        repeat: {
          every:
            this.configService.getNumber(
              'VIDEO_HARD_DELETE_CLEANUP_INTERVAL_SECONDS',
              300,
            ) * 1000,
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
