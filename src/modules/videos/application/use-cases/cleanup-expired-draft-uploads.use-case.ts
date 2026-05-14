import { Inject, Injectable } from '@nestjs/common';
import {
  OBJECT_STORAGE_SERVICE,
  type IObjectStorageService,
} from '@shared/application/interfaces/object-storage.service.interface';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { LoggerService } from '@shared/infrastructure/logger/logger.service';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';

@Injectable()
export class CleanupExpiredDraftUploadsUseCase extends BaseUseCase<void, void> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService: IObjectStorageService,
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {
    super();
    this.loggerService.setContext(CleanupExpiredDraftUploadsUseCase.name);
  }

  async execute(): Promise<void> {
    const ttlMs =
      this.configService.getVideoDraftUploadTtlHours() * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - ttlMs);
    const drafts = await this.videoRepository.findExpiredDrafts(
      cutoffDate,
      this.configService.getVideoDraftCleanupBatchSize(),
    );

    for (const draft of drafts) {
      await this.cleanupDraft(draft.id, draft.rawFileKey);
    }
  }

  private async cleanupDraft(
    videoId: string,
    rawFileKey: string,
  ): Promise<void> {
    try {
      if (await this.objectStorageService.objectExists('raw', rawFileKey)) {
        await this.objectStorageService.deleteObject('raw', rawFileKey);
      }
      await this.videoRepository.deleteDraftById(videoId);
      this.loggerService.logInfo('Cleaned up expired draft upload', {
        videoId,
        rawFileKey,
      });
    } catch (error: unknown) {
      this.loggerService.logWarn('Failed to clean up expired draft upload', {
        videoId,
        rawFileKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
