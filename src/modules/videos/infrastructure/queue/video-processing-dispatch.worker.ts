import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  VIDEO_PROCESSING_JOB_DISPATCHER,
  type IVideoProcessingJobDispatcher,
  type VideoProcessingJobPayload,
} from '@shared/application/interfaces/video-processing-job-dispatcher.interface';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import { LoggerService } from '@shared/infrastructure/logger/logger.service';
import { VideoProcessingDispatchStatus } from '../persistence/video-processing-dispatch.orm-entity';

interface ClaimedVideoProcessingDispatch {
  id: string;
  jobId: string;
  payload: VideoProcessingJobPayload;
  attemptCount: number;
}

@Injectable()
export class VideoProcessingDispatchWorker
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    private readonly dataSource: DataSource,
    @Inject(VIDEO_PROCESSING_JOB_DISPATCHER)
    private readonly videoProcessingJobDispatcher: IVideoProcessingJobDispatcher,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(VideoProcessingDispatchWorker.name);
  }

  onApplicationBootstrap(): void {
    const intervalMs = this.configService.getNumber(
      'VIDEO_PROCESSING_DISPATCH_INTERVAL_MS',
      5000,
    );

    this.timer = setInterval(() => {
      void this.dispatchPendingBatch();
    }, intervalMs);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async dispatchPendingBatch(): Promise<number> {
    if (this.isRunning) {
      return 0;
    }

    this.isRunning = true;

    try {
      const dispatches = await this.claimPendingDispatches();

      for (const dispatch of dispatches) {
        await this.dispatchOne(dispatch);
      }

      return dispatches.length;
    } finally {
      this.isRunning = false;
    }
  }

  private async claimPendingDispatches(): Promise<
    ClaimedVideoProcessingDispatch[]
  > {
    const batchSize = this.configService.getNumber(
      'VIDEO_PROCESSING_DISPATCH_BATCH_SIZE',
      20,
    );
    const lockTimeoutSeconds = this.configService.getNumber(
      'VIDEO_PROCESSING_DISPATCH_LOCK_TIMEOUT_SECONDS',
      60,
    );

    return this.dataSource.query<ClaimedVideoProcessingDispatch[]>(
      `
        WITH claimed AS (
          UPDATE "video_processing_dispatches"
          SET
            "status" = $1,
            "locked_at" = NOW(),
            "updated_at" = NOW()
          WHERE "id" IN (
            SELECT "id"
            FROM "video_processing_dispatches"
            WHERE (
              "status" = $2
              AND "next_attempt_at" <= NOW()
            )
            OR (
              "status" = $1
              AND "locked_at" < NOW() - ($4 * INTERVAL '1 second')
            )
            ORDER BY "created_at" ASC
            LIMIT $3
            FOR UPDATE SKIP LOCKED
          )
          RETURNING
            "id",
            "job_id",
            "payload",
            "attempt_count"
        )
        SELECT
          "id",
          "job_id" AS "jobId",
          "payload",
          "attempt_count" AS "attemptCount"
        FROM claimed
      `,
      [
        VideoProcessingDispatchStatus.PROCESSING,
        VideoProcessingDispatchStatus.PENDING,
        batchSize,
        lockTimeoutSeconds,
      ],
    );
  }

  private async dispatchOne(
    dispatch: ClaimedVideoProcessingDispatch,
  ): Promise<void> {
    try {
      await this.videoProcessingJobDispatcher.enqueueTranscodeJob(
        dispatch.payload,
        { jobId: dispatch.jobId },
      );

      await this.markDispatched(dispatch.id);
    } catch (error: unknown) {
      await this.markPending(dispatch, error);
      this.logger.logError('Video processing dispatch failed', error, {
        dispatchId: dispatch.id,
        jobId: dispatch.jobId,
      });
    }
  }

  private async markDispatched(id: string): Promise<void> {
    await this.dataSource.query(
      `
        UPDATE "video_processing_dispatches"
        SET
          "status" = $1,
          "dispatched_at" = NOW(),
          "locked_at" = NULL,
          "updated_at" = NOW()
        WHERE "id" = $2
      `,
      [VideoProcessingDispatchStatus.DISPATCHED, id],
    );
  }

  private async markPending(
    dispatch: ClaimedVideoProcessingDispatch,
    error: unknown,
  ): Promise<void> {
    const nextAttemptAt = new Date(
      Date.now() + this.getBackoffMs(dispatch.attemptCount),
    );
    const lastError = this.getErrorMessage(error).slice(0, 4000);

    await this.dataSource.query(
      `
        UPDATE "video_processing_dispatches"
        SET
          "status" = $1,
          "attempt_count" = "attempt_count" + 1,
          "next_attempt_at" = $2,
          "locked_at" = NULL,
          "last_error" = $3,
          "updated_at" = NOW()
        WHERE "id" = $4
      `,
      [
        VideoProcessingDispatchStatus.PENDING,
        nextAttemptAt,
        lastError,
        dispatch.id,
      ],
    );
  }

  private getBackoffMs(attemptCount: number): number {
    const safeAttemptCount = Number.isFinite(attemptCount) ? attemptCount : 0;
    const maxBackoffSeconds = this.configService.getNumber(
      'VIDEO_PROCESSING_DISPATCH_MAX_BACKOFF_SECONDS',
      300,
    );
    const backoffSeconds = Math.min(
      maxBackoffSeconds,
      2 ** Math.min(safeAttemptCount, 8),
    );

    return backoffSeconds * 1000;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown dispatch error';
  }
}
