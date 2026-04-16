import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import { PlaybackTokenService } from '@shared/infrastructure/security/playback-token.service';
import { MinioService } from '@shared/infrastructure/storage/minio.service';
import { VideoQueueService } from '@shared/infrastructure/queue/video-queue.service';
import { CacheService } from '@shared/infrastructure/cache/cache.service';
import { KAFKA_SERVICE } from '@shared/infrastructure/messaging/kafka.constants';
import { KafkaService } from '@shared/infrastructure/messaging/kafka.service';
import type { IIntegrationEvent } from '@shared/domain/types/events/base-integration.event';
import {
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import { RecordVideoViewUseCase } from '../../engagement/application/use-cases/record-video-view.use-case';
import {
  VideoEntity,
  VideoStatus,
  VideoVisibility,
} from '../domain/entities/video.entity';
import { VideoPurchaseUnlockEntity } from '../domain/entities/video-purchase-unlock.entity';
import {
  CHANNEL_ACCESS_SERVICE,
  type IChannelAccessService,
} from '../../channels/application/interfaces/channel-access.service.interface';
import {
  type IVideoPurchaseUnlockRepository,
  VIDEO_PURCHASE_UNLOCK_REPOSITORY,
} from '../domain/repositories/video-purchase-unlock.repository';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../domain/repositories/video.repository';

interface VideoProcessedSuccessData {
  videoId: string;
  masterPlaylistKey: string;
  durationSeconds?: number;
  thumbnailUrl?: string | null;
  resolution?: string[];
}

interface VideoProcessedFailedData {
  videoId: string;
  errorMessage: string;
}

@Injectable()
export class VideoApplicationService {
  constructor(
    private readonly configService: ConfigService,
    private readonly minioService: MinioService,
    private readonly videoQueueService: VideoQueueService,
    private readonly playbackTokenService: PlaybackTokenService,
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(VIDEO_PURCHASE_UNLOCK_REPOSITORY)
    private readonly unlockRepository: IVideoPurchaseUnlockRepository,
    @Inject(CHANNEL_ACCESS_SERVICE)
    private readonly channelAccessService: IChannelAccessService,
    private readonly recordVideoViewUseCase: RecordVideoViewUseCase,
    private readonly cacheService: CacheService,
    @Inject(KAFKA_SERVICE) private readonly kafkaService: KafkaService,
  ) {}

  async initUpload(input: {
    userId: string;
    channelId: string;
    title: string;
    description: string;
    category: string;
    visibility: VideoVisibility;
    price: number;
    requiredTierLevel: number | null;
  }): Promise<{
    videoId: string;
    status: string;
    rawFileKey: string;
    bucket: string;
    uploadUrl: string;
  }> {
    await this.channelAccessService.assertOwnedActiveChannel(
      input.channelId,
      input.userId,
    );

    const rawFileKey = `uploads/raw/${input.channelId}/${Date.now()}-${crypto.randomUUID()}.mp4`;
    const video = VideoEntity.create({
      channelId: input.channelId,
      ownerId: input.userId,
      title: input.title,
      description: input.description,
      category: input.category,
      visibility: input.visibility,
      price: input.price,
      requiredTierLevel: input.requiredTierLevel,
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

  async confirmUpload(input: {
    userId: string;
    videoId: string;
    resolutions: string[];
  }): Promise<{ status: string; message: string }> {
    const video = await this.videoRepository.findById(input.videoId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    if (video.ownerId !== input.userId) {
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
      resolution: input.resolutions,
      userId: input.userId,
    });

    return {
      status: video.status,
      message: 'Video đang được xử lý, bạn sẽ nhận được thông báo khi hoàn tất',
    };
  }

  async playVideo(input: { userId: string; videoId: string }): Promise<{
    videoId: string;
    title: string;
    description: string;
    playbackToken: string;
    playbackUrl: string;
  }> {
    const video = await this.videoRepository.findById(input.videoId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    await this.assertAccess(video, input.userId);

    const playbackToken = this.playbackTokenService.issueToken({
      videoId: video.id,
      userId: input.userId,
      channelId: video.channelId,
    });

    await this.recordVideoViewUseCase.execute({
      videoId: video.id,
      userId: input.userId,
    });

    return {
      videoId: video.id,
      title: video.title,
      description: video.description,
      playbackToken,
      playbackUrl: `/api/media/stream/${video.id}/master.m3u8?token=${playbackToken}`,
    };
  }

  async unlockVideo(input: { userId: string; videoId: string }): Promise<void> {
    if (!(await this.unlockRepository.exists(input.videoId, input.userId))) {
      await this.unlockRepository.save(VideoPurchaseUnlockEntity.create(input));
    }
  }

  async getLatest(limit: number): Promise<VideoEntity[]> {
    return this.videoRepository.findLatestPublic(limit);
  }

  async getByCategory(category: string, limit: number): Promise<VideoEntity[]> {
    return this.videoRepository.findByCategory(category, limit);
  }

  async getSubscribed(userId: string, limit: number): Promise<VideoEntity[]> {
    const channelIds =
      await this.channelAccessService.getActiveSubscribedChannelIds(userId);

    return this.videoRepository.findByChannelIds(channelIds, limit);
  }

  async getPublicByChannel(channelId: string): Promise<VideoEntity[]> {
    return this.videoRepository.findPublicByChannelId(channelId);
  }

  async handleProcessingEvents(): Promise<void> {
    await this.kafkaService.on<IIntegrationEvent<VideoProcessedSuccessData>>(
      this.configService.get<string>(
        'KAFKA_VIDEO_PROCESSED_SUCCESS_TOPIC',
        'video.processed.success',
      ),
      async ({ value }) => {
        if (!(await this.markEventProcessed(value.eventId))) {
          return;
        }
        const video = await this.videoRepository.findById(value.data.videoId);
        if (!video) {
          return;
        }
        video.markPublic({
          masterPlaylistKey: value.data.masterPlaylistKey,
          durationSeconds: value.data.durationSeconds ?? null,
          thumbnailUrl: value.data.thumbnailUrl ?? null,
          resolutions: value.data.resolution ?? [],
        });
        await this.videoRepository.save(video);
      },
    );

    await this.kafkaService.on<IIntegrationEvent<VideoProcessedFailedData>>(
      this.configService.get<string>(
        'KAFKA_VIDEO_PROCESSED_FAILED_TOPIC',
        'video.processed.failed',
      ),
      async ({ value }) => {
        if (!(await this.markEventProcessed(value.eventId))) {
          return;
        }
        const video = await this.videoRepository.findById(value.data.videoId);
        if (!video) {
          return;
        }
        video.markFailed(value.data.errorMessage);
        await this.videoRepository.save(video);
      },
    );
  }

  private async assertAccess(
    video: VideoEntity,
    userId: string,
  ): Promise<void> {
    if (video.status !== VideoStatus.PUBLIC) {
      throw new NotFoundException('Video is not public');
    }

    const accessContext =
      await this.channelAccessService.getViewerAccessContext(
        video.channelId,
        userId,
      );

    if (accessContext.channelOwnerId === userId) {
      return;
    }

    if (video.price === 0 && video.requiredTierLevel === null) {
      return;
    }

    if (
      video.requiredTierLevel !== null &&
      accessContext.activeMembershipTierLevel !== null &&
      accessContext.activeMembershipTierLevel >= video.requiredTierLevel
    ) {
      return;
    }

    if (await this.unlockRepository.exists(video.id, userId)) {
      return;
    }

    throw new ForbiddenException(
      'You do not have permission to watch this video',
    );
  }

  private async markEventProcessed(eventId: string): Promise<boolean> {
    return this.cacheService.setIfNotExists(
      `media:event:${eventId}`,
      '1',
      60 * 60 * 24,
    );
  }
}
