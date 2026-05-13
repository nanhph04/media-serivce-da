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
  type IVideoProgressStore,
  VIDEO_PROGRESS_STORE,
} from '../interfaces/video-progress-store.interface';
import { VideoProgressService } from '../services/video-progress.service';
import {
  type IVideoWatchdogHealthFailureStore,
  VIDEO_WATCHDOG_HEALTH_FAILURE_STORE,
} from '../interfaces/video-watchdog-health-failure-store.interface';
import {
  type IVideoWorkerHealthChecker,
  type VideoWorkerPipeline,
  VIDEO_WORKER_HEALTH_CHECKER,
} from '../interfaces/video-worker-health-checker.interface';

const MODERATION_STALE_MESSAGE = 'Moderation is taking longer than expected';
const PROCESSING_STALE_MESSAGE =
  'Video processing is taking longer than expected';

@Injectable()
export class CheckStaleVideoProcessingUseCase extends BaseUseCase<void, void> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(VIDEO_PROGRESS_STORE)
    private readonly videoProgressStore: IVideoProgressStore,
    @Inject(VIDEO_WORKER_HEALTH_CHECKER)
    private readonly videoWorkerHealthChecker: IVideoWorkerHealthChecker,
    @Inject(VIDEO_WATCHDOG_HEALTH_FAILURE_STORE)
    private readonly healthFailureStore: IVideoWatchdogHealthFailureStore,
    private readonly videoProgressService: VideoProgressService,
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
      staleMessage: MODERATION_STALE_MESSAGE,
      failedMessage: 'Moderation service unavailable',
      defaultPercent: 10,
    });
    await this.checkPipeline({
      pipeline: 'processing',
      status: VideoStatus.PROCESSING,
      timeoutSeconds: this.configService.getVideoProcessingTimeoutSeconds(),
      staleMessage: PROCESSING_STALE_MESSAGE,
      failedMessage: 'Processing service unavailable',
      defaultPercent: 5,
    });
  }

  private async checkPipeline(input: {
    pipeline: VideoWorkerPipeline;
    status: VideoStatus;
    timeoutSeconds: number;
    staleMessage: string;
    failedMessage: string;
    defaultPercent: number;
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
      await this.publishStaleProgress(input, staleVideos);
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
      await this.videoProgressService.applyProgressUpdate(
        this.videoProgressService.createSnapshot({
          videoId: video.id,
          stage: 'failed',
          percent: 100,
          message: input.failedMessage,
          terminal: true,
          errorCode: `${input.pipeline.toUpperCase()}_SERVICE_UNAVAILABLE`,
        }),
      );
    }
  }

  private async publishStaleProgress(
    input: {
      pipeline: VideoWorkerPipeline;
      status: VideoStatus;
      staleMessage: string;
      defaultPercent: number;
    },
    staleVideos: Array<{
      id: string;
      status: VideoStatus;
      statusChangedAt: Date;
    }>,
  ): Promise<void> {
    for (const video of staleVideos) {
      const current = await this.videoProgressStore.get(video.id);
      if (
        current?.terminal ||
        !this.shouldPublishStaleProgress(current, input.staleMessage)
      ) {
        continue;
      }

      this.loggerService.logWarn(
        'Video processing is stale but worker is healthy',
        {
          videoId: video.id,
          status: video.status,
          statusChangedAt: video.statusChangedAt.toISOString(),
          pipeline: input.pipeline,
        },
      );

      await this.videoProgressService.applyProgressUpdate(
        this.videoProgressService.createSnapshot({
          videoId: video.id,
          stage:
            input.pipeline === 'moderation'
              ? 'pending_moderation'
              : 'processing',
          percent:
            input.pipeline === 'processing' && current?.stage === 'processing'
              ? current.percent
              : input.defaultPercent,
          message: input.staleMessage,
          terminal: false,
        }),
      );
    }
  }

  private shouldPublishStaleProgress(
    current: { message: string; updatedAt: string } | null,
    staleMessage: string,
  ): boolean {
    if (!current) {
      return true;
    }

    if (current.message !== staleMessage) {
      return true;
    }

    const updatedAt = Date.parse(current.updatedAt);
    if (Number.isNaN(updatedAt)) {
      return true;
    }

    const intervalMs =
      this.configService.getVideoWatchdogStaleProgressIntervalSeconds() * 1000;
    return Date.now() - updatedAt >= intervalMs;
  }
}
