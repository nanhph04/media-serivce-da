import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import { VideoQueueService } from '@shared/infrastructure/queue/video-queue.service';
import { MinioService } from '@shared/infrastructure/storage/minio.service';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import type { ConfirmVideoUploadCommand } from '../dtos/confirm-video-upload.command';
import type { ConfirmVideoUploadResponse } from '../dtos/confirm-video-upload.response';

@Injectable()
export class ConfirmVideoUploadUseCase extends BaseUseCase<
  ConfirmVideoUploadCommand,
  ConfirmVideoUploadResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    private readonly minioService: MinioService,
    private readonly videoQueueService: VideoQueueService,
  ) {
    super();
  }

  async execute(
    command: ConfirmVideoUploadCommand,
  ): Promise<ConfirmVideoUploadResponse> {
    const video = await this.videoRepository.findById(command.videoId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    if (video.ownerId !== command.userId) {
      throw new ForbiddenException('You do not own this video');
    }

    const exists = await this.minioService.objectExists(
      this.minioService.getRawBucket(),
      video.rawFileKey,
    );
    if (!exists) {
      throw new NotFoundException('Raw upload file not found');
    }

    video.markProcessing();
    await this.videoRepository.save(video);
    await this.videoQueueService.enqueueTranscodeJob({
      videoId: video.id,
      rawFileKey: video.rawFileKey,
      resolution: command.resolutions,
      userId: command.userId,
    });

    return {
      status: video.status,
      message: 'Video đang được xử lý, bạn sẽ nhận được thông báo khi hoàn tất',
    };
  }
}
