import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { CacheService } from '@shared/infrastructure/cache/cache.service';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import type { HandleVideoProcessedFailedCommand } from '../dtos/handle-video-processed-failed.command';

@Injectable()
export class HandleVideoProcessedFailedUseCase extends BaseUseCase<
  HandleVideoProcessedFailedCommand,
  void
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    private readonly cacheService: CacheService,
  ) {
    super();
  }

  async execute(command: HandleVideoProcessedFailedCommand): Promise<void> {
    if (!(await this.markEventProcessed(command.eventId))) {
      return;
    }

    const video = await this.videoRepository.findById(command.data.videoId);
    if (!video) {
      return;
    }

    video.markFailed(command.data.errorMessage);
    await this.videoRepository.save(video);
  }

  private async markEventProcessed(eventId: string): Promise<boolean> {
    return this.cacheService.setIfNotExists(
      `media:event:${eventId}`,
      '1',
      60 * 60 * 24,
    );
  }
}
