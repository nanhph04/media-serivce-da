import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { CacheService } from '@shared/infrastructure/cache/cache.service';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import type { HandleVideoProcessedSuccessCommand } from '../dtos/handle-video-processed-success.command';

@Injectable()
export class HandleVideoProcessedSuccessUseCase extends BaseUseCase<
  HandleVideoProcessedSuccessCommand,
  void
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    private readonly cacheService: CacheService,
  ) {
    super();
  }

  async execute(command: HandleVideoProcessedSuccessCommand): Promise<void> {
    if (!(await this.markEventProcessed(command.eventId))) {
      return;
    }

    const video = await this.videoRepository.findById(command.data.videoId);
    if (!video) {
      return;
    }

    video.markPublic({
      masterPlaylistKey: command.data.masterPlaylistKey,
      durationSeconds: command.data.durationSeconds ?? null,
      thumbnailUrl: command.data.thumbnailUrl ?? null,
      resolutions: command.data.resolution ?? [],
    });

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
