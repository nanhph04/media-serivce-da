import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  IDEMPOTENCY_STORE,
  type IIdempotencyStore,
} from '@shared/application/interfaces/cache-store.interface';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import { VideoStatus } from '../../domain/entities/video.entity';
import type { HandleVideoProcessedFailedCommand } from '../dtos/handle-video-processed-failed.command';
import { VideoProgressService } from '../services/video-progress.service';
import { LoggerService } from '@shared/infrastructure/logger/logger.service';

@Injectable()
export class HandleVideoProcessedFailedUseCase extends BaseUseCase<
  HandleVideoProcessedFailedCommand,
  void
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(IDEMPOTENCY_STORE)
    private readonly idempotencyStore: IIdempotencyStore,
    private readonly videoProgressService: VideoProgressService,
    private readonly loggerService: LoggerService,
  ) {
    super();
    this.loggerService.setContext(HandleVideoProcessedFailedUseCase.name);
  }

  async execute(command: HandleVideoProcessedFailedCommand): Promise<void> {
    if (!(await this.markEventProcessed(command.eventId))) {
      return;
    }

    const video = await this.videoRepository.findById(command.data.videoId);
    if (!video) {
      return;
    }

    if (video.status !== VideoStatus.PROCESSING) {
      this.loggerService.logWarn(
        'Ignoring stale video processed failed event',
        {
          eventId: command.eventId,
          videoId: command.data.videoId,
          currentStatus: video.status,
        },
      );
      return;
    }

    video.markFailed(command.data.errorMessage);
    await this.videoRepository.save(video);
    await this.videoProgressService.applyProgressUpdate(
      this.videoProgressService.createSnapshot({
        videoId: command.data.videoId,
        stage: 'failed',
        percent: 100,
        message: command.data.errorMessage || 'Video processing failed',
        terminal: true,
      }),
    );
  }

  private async markEventProcessed(eventId: string): Promise<boolean> {
    return this.idempotencyStore.setIfNotExists(
      `media:event:${eventId}`,
      '1',
      60 * 60 * 24,
    );
  }
}
