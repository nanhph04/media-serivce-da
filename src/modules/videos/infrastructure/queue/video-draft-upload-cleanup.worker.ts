import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import { LoggerService } from '@shared/infrastructure/logger/logger.service';
import { CleanupExpiredDraftUploadsUseCase } from '../../application/use-cases/cleanup-expired-draft-uploads.use-case';

interface CleanupDraftUploadsJobData {
  triggeredAt: string;
}

@Injectable()
export class VideoDraftUploadCleanupWorker
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly queue: Queue<CleanupDraftUploadsJobData>;
  private readonly worker: Worker<CleanupDraftUploadsJobData>;

  constructor(
    private readonly configService: ConfigService,
    private readonly cleanupExpiredDraftUploadsUseCase: CleanupExpiredDraftUploadsUseCase,
    private readonly logger: LoggerService,
  ) {
    const connection = {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.getNumber('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.getNumber('REDIS_DB', 0),
    };

    this.queue = new Queue<CleanupDraftUploadsJobData>(
      'video-draft-upload-cleanup',
      { connection },
    );
    this.worker = new Worker<CleanupDraftUploadsJobData>(
      'video-draft-upload-cleanup',
      async () => {
        await this.cleanupExpiredDraftUploadsUseCase.execute();
      },
      {
        connection,
        concurrency: 1,
      },
    );

    this.logger.setContext(VideoDraftUploadCleanupWorker.name);
    this.worker.on('failed', (job, error) => {
      this.logger.logError('Video draft upload cleanup job failed', error, {
        jobId: job?.id,
      });
    });
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.queue.add(
      'cleanup-draft-uploads',
      { triggeredAt: new Date().toISOString() },
      {
        jobId: 'cleanup-draft-uploads',
        repeat: {
          every:
            this.configService.getVideoDraftCleanupIntervalSeconds() * 1000,
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
