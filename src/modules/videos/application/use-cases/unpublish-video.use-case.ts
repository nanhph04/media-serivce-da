import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import type { IIntegrationEvent } from '@shared/domain/types/events/base-integration.event';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import type { VideoDeleteRequestedEventData } from '../dtos/video-delete-requested.event-data';
import type { UnpublishVideoResponse } from '../dtos/unpublish-video.response';
import {
  VIDEO_OUTBOX_TRANSACTION,
  type IVideoOutboxTransaction,
} from '../interfaces/video-outbox-transaction.interface';

const CREATOR_DELETE_REASON = 'creator_delete';
const REFUND_WINDOW_HOURS = 72;
const VIDEO_DELETE_REQUESTED_TOPIC = 'video.delete.requested';

@Injectable()
export class UnpublishVideoUseCase extends BaseUseCase<
  { userId: string; videoId: string },
  UnpublishVideoResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(VIDEO_OUTBOX_TRANSACTION)
    private readonly videoOutboxTransaction: IVideoOutboxTransaction,
  ) {
    super();
  }

  async execute(command: {
    userId: string;
    videoId: string;
  }): Promise<UnpublishVideoResponse> {
    const video = await this.videoRepository.findById(command.videoId);
    if (!video) {
      throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    }
    if (video.ownerId !== command.userId) {
      throw new ForbiddenException(ERROR_MESSAGES.VIDEO_NOT_OWNED);
    }

    if (!video.isDeletePending) {
      video.unpublish({
        deletedBy: command.userId,
        reason: CREATOR_DELETE_REASON,
      });
    }

    const data: VideoDeleteRequestedEventData = {
      videoId: video.id,
      channelId: video.channelId,
      ownerId: video.ownerId,
      deletedBy: command.userId,
      deletedAt: (video.deleteRequestedAt ?? new Date()).toISOString(),
      refundWindowHours: REFUND_WINDOW_HOURS,
    };
    const event: IIntegrationEvent<VideoDeleteRequestedEventData> = {
      eventId: randomUUID(),
      eventType: VIDEO_DELETE_REQUESTED_TOPIC,
      aggregateId: video.id,
      timestamp: data.deletedAt,
      version: 1,
      traceId: randomUUID(),
      sourceService: 'media-service',
      data,
    };

    await this.videoOutboxTransaction.saveVideoWithOutbox(video, {
      topic: VIDEO_DELETE_REQUESTED_TOPIC,
      messageKey: video.id,
      payload: event,
    });

    return {
      videoId: video.id,
      unpublished: true,
    };
  }
}
