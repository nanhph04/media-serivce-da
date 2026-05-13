import { Inject, Injectable } from '@nestjs/common';
import {
  OBJECT_STORAGE_SERVICE,
  type IObjectStorageService,
} from '@shared/application/interfaces/object-storage.service.interface';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import { LoggerService } from '@shared/infrastructure/logger/logger.service';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import type { ReplaceVideoUploadResponse } from '../dtos/replace-video-upload.response';

@Injectable()
export class ReplaceVideoUploadUseCase extends BaseUseCase<
  { userId: string; videoId: string },
  ReplaceVideoUploadResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService: IObjectStorageService,
    private readonly loggerService: LoggerService,
  ) {
    super();
    this.loggerService.setContext(ReplaceVideoUploadUseCase.name);
  }

  async execute(command: {
    userId: string;
    videoId: string;
  }): Promise<ReplaceVideoUploadResponse> {
    const video = await this.videoRepository.findById(command.videoId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    if (video.ownerId !== command.userId) {
      throw new ForbiddenException('You do not own this video');
    }

    const previousRawFileKey = video.rawFileKey;
    const nextRawFileKey = this.createRawFileKey(video.channelId);
    video.replaceDraftRawFile(nextRawFileKey);
    await this.videoRepository.save(video);
    await this.deletePreviousRawFileIfPresent(previousRawFileKey);

    return {
      videoId: video.id,
      status: video.status,
      rawFileKey: nextRawFileKey,
      bucket: this.objectStorageService.getBucketName('raw'),
      uploadUrl: await this.objectStorageService.createUploadUrl(
        'raw',
        nextRawFileKey,
      ),
    };
  }

  private createRawFileKey(channelId: string): string {
    return `uploads/raw/${channelId}/${Date.now()}-${crypto.randomUUID()}.mp4`;
  }

  private async deletePreviousRawFileIfPresent(
    rawFileKey: string,
  ): Promise<void> {
    try {
      if (await this.objectStorageService.objectExists('raw', rawFileKey)) {
        await this.objectStorageService.deleteObject('raw', rawFileKey);
      }
    } catch (error: unknown) {
      this.loggerService.logWarn(
        'Failed to delete replaced raw upload object',
        {
          rawFileKey,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      );
    }
  }
}
