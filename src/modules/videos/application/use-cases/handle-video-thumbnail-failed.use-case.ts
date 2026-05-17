import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  IDEMPOTENCY_STORE,
  type IIdempotencyStore,
} from '@shared/application/interfaces/cache-store.interface';
import { LoggerService } from '@shared/infrastructure/logger/logger.service';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import type { HandleVideoThumbnailFailedCommand } from '../dtos/handle-video-thumbnail-failed.command';

@Injectable()
export class HandleVideoThumbnailFailedUseCase extends BaseUseCase<
  HandleVideoThumbnailFailedCommand,
  void
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(IDEMPOTENCY_STORE)
    private readonly idempotencyStore: IIdempotencyStore,
    private readonly loggerService: LoggerService,
  ) {
    super();
    this.loggerService.setContext(HandleVideoThumbnailFailedUseCase.name);
  }

  async execute(command: HandleVideoThumbnailFailedCommand): Promise<void> {
    if (!(await this.markEventProcessed(command.eventId))) {
      return;
    }

    const video = await this.videoRepository.findById(command.data.videoId);
    if (!video) {
      this.loggerService.logWarn('Ignoring thumbnail failure for missing video', {
        eventId: command.eventId,
        videoId: command.data.videoId,
      });
      return;
    }

    video.markAutoThumbnailFailed(command.data.message);
    await this.videoRepository.save(video);
  }

  private async markEventProcessed(eventId: string): Promise<boolean> {
    return this.idempotencyStore.setIfNotExists(
      `media:event:${eventId}`,
      '1',
      60 * 60 * 24,
    );
  }
}
