import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { MinioService } from '@shared/infrastructure/storage/minio.service';
import {
  CHANNEL_ACCESS_SERVICE,
  type IChannelAccessService,
} from '../../../channels/application/interfaces/channel-access.service.interface';
import { VideoEntity } from '../../domain/entities/video.entity';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import type { InitVideoUploadCommand } from '../dtos/init-video-upload.command';
import type { InitVideoUploadResponse } from '../dtos/init-video-upload.response';

@Injectable()
export class InitVideoUploadUseCase extends BaseUseCase<
  InitVideoUploadCommand,
  InitVideoUploadResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(CHANNEL_ACCESS_SERVICE)
    private readonly channelAccessService: IChannelAccessService,
    private readonly minioService: MinioService,
  ) {
    super();
  }

  async execute(
    command: InitVideoUploadCommand,
  ): Promise<InitVideoUploadResponse> {
    await this.channelAccessService.assertOwnedActiveChannel(
      command.channelId,
      command.userId,
    );

    const rawFileKey = `uploads/raw/${command.channelId}/${Date.now()}-${crypto.randomUUID()}.mp4`;
    const video = VideoEntity.create({
      channelId: command.channelId,
      ownerId: command.userId,
      title: command.title,
      description: command.description,
      category: command.category,
      visibility: command.visibility,
      price: command.price,
      requiredTierLevel: command.requiredTierLevel,
      rawFileKey,
    });

    await this.videoRepository.save(video);

    return {
      videoId: video.id,
      status: video.status,
      rawFileKey,
      bucket: this.minioService.getRawBucket(),
      uploadUrl: await this.minioService.createRawUploadUrl(rawFileKey),
    };
  }
}
