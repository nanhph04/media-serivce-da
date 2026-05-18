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
  CHANNEL_REPOSITORY,
  type IChannelRepository,
} from '../../../channels/domain/repositories/channel.repository';
import { ChannelStatus } from '../../../channels/domain/entities/channel.entity';
import {
  VideoDeletionStatus,
  type VideoEntity,
  VideoStatus,
  VideoThumbnailStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import type { VideoThumbnailResponse } from '../dtos/video-thumbnail.response';

export type VideoThumbnailAccessMode = 'public' | 'owner';

@Injectable()
export class GetVideoThumbnailUseCase extends BaseUseCase<
  { videoId: string; mode: VideoThumbnailAccessMode; userId?: string },
  VideoThumbnailResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService: IObjectStorageService,
  ) {
    super();
  }

  async execute(command: {
    videoId: string;
    mode: VideoThumbnailAccessMode;
    userId?: string;
  }): Promise<VideoThumbnailResponse> {
    const video = await this.videoRepository.findBasicById(command.videoId);
    if (!video) {
      throw new NotFoundException('Thumbnail not found');
    }

    if (command.mode === 'owner') {
      this.assertOwnerAccess(video, command.userId);
    } else {
      await this.assertPublicAccess(video);
    }

    const thumbnailObjectKey = this.getReadyThumbnailObjectKey(video);
    const exists = await this.objectStorageService.objectExists(
      'processed',
      thumbnailObjectKey,
    );
    if (!exists) {
      throw new NotFoundException('Thumbnail not found');
    }

    return {
      stream: await this.objectStorageService.getObjectStream(
        'processed',
        thumbnailObjectKey,
      ),
      contentType: this.resolveContentType(thumbnailObjectKey),
      cacheControl:
        command.mode === 'public'
          ? 'public, max-age=3600'
          : 'private, max-age=300',
    };
  }

  private async assertPublicAccess(video: VideoEntity): Promise<void> {
    if (
      video.status !== VideoStatus.READY ||
      video.visibility !== VideoVisibility.PUBLIC ||
      video.deletionStatus !== VideoDeletionStatus.ACTIVE
    ) {
      throw new NotFoundException('Thumbnail not found');
    }

    const channel = await this.channelRepository.findById(video.channelId);
    if (!channel || channel.status !== ChannelStatus.ACTIVE) {
      throw new NotFoundException('Thumbnail not found');
    }
  }

  private assertOwnerAccess(video: VideoEntity, userId?: string): void {
    if (!userId || video.ownerId !== userId) {
      throw new ForbiddenException('You do not own this video');
    }
  }

  private getReadyThumbnailObjectKey(video: VideoEntity): string {
    if (
      video.thumbnailStatus !== VideoThumbnailStatus.READY ||
      !video.thumbnailObjectKey
    ) {
      throw new NotFoundException('Thumbnail not found');
    }

    return video.thumbnailObjectKey;
  }

  private resolveContentType(objectKey: string): string {
    const extension = objectKey.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'jpg':
      case 'jpeg':
      default:
        return 'image/jpeg';
    }
  }
}
