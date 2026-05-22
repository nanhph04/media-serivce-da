import { Inject, Injectable } from '@nestjs/common';
import {
  OBJECT_STORAGE_SERVICE,
  type IObjectStorageService,
} from '@shared/application/interfaces/object-storage.service.interface';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import { LoggerService } from '@shared/infrastructure/logger/logger.service';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';

@Injectable()
export class CleanupHardDeletedVideosUseCase extends BaseUseCase<void, void> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService: IObjectStorageService,
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {
    super();
    this.loggerService.setContext(CleanupHardDeletedVideosUseCase.name);
  }

  async execute(): Promise<void> {
    const limit = this.configService.getNumber(
      'VIDEO_HARD_DELETE_CLEANUP_BATCH_SIZE',
      20,
    );
    const videos = await this.videoRepository.findReadyForHardDelete(limit);

    for (const video of videos) {
      try {
        await this.deleteObjectIfExists('raw', video.rawFileKey);
        if (video.masterPlaylistKey) {
          await this.deleteObjectIfExists('processed', video.masterPlaylistKey);
        }
        if (video.thumbnailObjectKey) {
          await this.deleteObjectIfExists('public', video.thumbnailObjectKey);
        }
        await this.videoRepository.hardDeleteById(video.id);
        this.loggerService.logInfo('Hard deleted refunded video', {
          videoId: video.id,
        });
      } catch (error: unknown) {
        this.loggerService.logWarn('Failed to hard delete refunded video', {
          videoId: video.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  private async deleteObjectIfExists(
    bucket: 'raw' | 'processed' | 'public',
    objectKey: string,
  ): Promise<void> {
    if (await this.objectStorageService.objectExists(bucket, objectKey)) {
      await this.objectStorageService.deleteObject(bucket, objectKey);
    }
  }
}
