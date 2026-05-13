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
import {
  type IVideoProgressStore,
  VIDEO_PROGRESS_STORE,
} from '../interfaces/video-progress-store.interface';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import type { CancelVideoUploadResponse } from '../dtos/cancel-video-upload.response';

@Injectable()
export class CancelVideoUploadUseCase extends BaseUseCase<
  { userId: string; videoId: string },
  CancelVideoUploadResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService: IObjectStorageService,
    @Inject(VIDEO_PROGRESS_STORE)
    private readonly videoProgressStore: IVideoProgressStore,
  ) {
    super();
  }

  async execute(command: {
    userId: string;
    videoId: string;
  }): Promise<CancelVideoUploadResponse> {
    const video = await this.videoRepository.findById(command.videoId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    if (video.ownerId !== command.userId) {
      throw new ForbiddenException('You do not own this video');
    }

    video.assertDraftUploadMutable();
    if (await this.objectStorageService.objectExists('raw', video.rawFileKey)) {
      await this.objectStorageService.deleteObject('raw', video.rawFileKey);
    }
    await this.videoProgressStore.delete(video.id);
    await this.videoRepository.deleteDraftById(video.id);

    return {
      videoId: video.id,
      cancelled: true,
    };
  }
}
