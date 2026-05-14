import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import { LoggerService } from '@shared/infrastructure/logger/logger.service';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { VideoStatus } from '../../domain/entities/video.entity';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import {
  type IVideoWatchdogHealthFailureStore,
  VIDEO_WATCHDOG_HEALTH_FAILURE_STORE,
} from '../interfaces/video-watchdog-health-failure-store.interface';
import {
  type IVideoWorkerHealthChecker,
  type VideoWorkerPipeline,
  VIDEO_WORKER_HEALTH_CHECKER,
} from '../interfaces/video-worker-health-checker.interface';

@Injectable()
export class CheckStaleVideoProcessingUseCase extends BaseUseCase<void, void> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(VIDEO_WORKER_HEALTH_CHECKER)
    private readonly videoWorkerHealthChecker: IVideoWorkerHealthChecker,
    @Inject(VIDEO_WATCHDOG_HEALTH_FAILURE_STORE)
    private readonly healthFailureStore: IVideoWatchdogHealthFailureStore,
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {
    super();
    this.loggerService.setContext(CheckStaleVideoProcessingUseCase.name);
  }

  async execute(): Promise<void> {
    await this.checkPipeline({
      pipeline: 'moderation',
      status: VideoStatus.PENDING_MODERATION,
      timeoutSeconds: this.configService.getVideoModerationTimeoutSeconds(),
      failedMessage: 'Moderation service unavailable',
    });
    await this.checkPipeline({
      pipeline: 'processing',
      status: VideoStatus.PROCESSING,
      timeoutSeconds: this.configService.getVideoProcessingTimeoutSeconds(),
      failedMessage: 'Processing service unavailable',
    });
  }

  private async checkPipeline(input: {
    pipeline: VideoWorkerPipeline;
    status: VideoStatus;
    timeoutSeconds: number;
    failedMessage: string;
  }): Promise<void> {
    const cutoffDate = new Date(Date.now() - input.timeoutSeconds * 1000);
    const staleVideos = await this.videoRepository.findStaleByStatus(
      input.status,
      cutoffDate,
      this.configService.getVideoWatchdogBatchSize(),
    );
    if (staleVideos.length === 0) {
      return;
    }

    const isHealthy = await this.videoWorkerHealthChecker.isHealthy(
      input.pipeline,
    );
    if (isHealthy) {
      await this.healthFailureStore.reset(input.pipeline);
      this.logHealthyStaleVideos(input.pipeline, staleVideos);
      return;
    }

    const failureCount = await this.healthFailureStore.increment(
      input.pipeline,
      this.configService.getVideoWatchdogHealthFailureTtlSeconds(),
    );
    this.loggerService.logWarn('Video worker health check is unhealthy', {
      pipeline: input.pipeline,
      failureCount,
      staleVideoCount: staleVideos.length,
    });

    if (
      failureCount < this.configService.getVideoWatchdogHealthFailureThreshold()
    ) {
      return;
    }

    for (const video of staleVideos) {
      video.markFailed(input.failedMessage);
      await this.videoRepository.save(video);
    }
  }

  private logHealthyStaleVideos(
    pipeline: VideoWorkerPipeline,
    staleVideos: Array<{
      id: string;
      status: VideoStatus;
      statusChangedAt: Date;
    }>,
  ): void {
    for (const video of staleVideos) {
      this.loggerService.logWarn(
        'Video pipeline is stale but worker is healthy',
        {
          videoId: video.id,
          status: video.status,
          statusChangedAt: video.statusChangedAt.toISOString(),
          pipeline,
        },
      );
    }
  }
}
