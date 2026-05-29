import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import {
  OutboxMessageOrmEntity,
  OutboxMessageStatus,
} from '@shared/infrastructure/messaging/outbox-message.orm-entity';
import type { VideoEntity } from '../../domain/entities/video.entity';
import type {
  IVideoOutboxTransaction,
  VideoOutboxMessage,
} from '../../application/interfaces/video-outbox-transaction.interface';
import { VideoOrmEntity } from './video.orm-entity';
import { VideoTagOrmEntity } from './video-tag.orm-entity';

@Injectable()
export class VideoOutboxTransactionService implements IVideoOutboxTransaction {
  constructor(private readonly dataSource: DataSource) {}

  async saveVideoWithOutbox(
    video: VideoEntity,
    outboxMessage: VideoOutboxMessage,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.save(VideoOrmEntity, {
        id: video.id,
        channelId: video.channelId,
        ownerId: video.ownerId,
        title: video.title,
        description: video.description,
        categoryId: video.category.id,
        visibility: video.visibility,
        status: video.status,
        price: video.price,
        requiredTierLevel: video.requiredTierLevel,
        rawFileKey: video.rawFileKey,
        masterPlaylistKey: video.masterPlaylistKey,
        thumbnailObjectKey: video.thumbnailObjectKey,
        thumbnailUrl: video.thumbnailUrl,
        thumbnailSource: video.thumbnailSource,
        thumbnailStatus: video.thumbnailStatus,
        thumbnailGeneratedAt: video.thumbnailGeneratedAt,
        thumbnailError: video.thumbnailError,
        durationSeconds: video.durationSeconds,
        resolutions: video.resolutions,
        processingWarnings: video.processingWarnings,
        errorMessage: video.errorMessage,
        moderationDetails: video.moderationDetails
          ? { ...video.moderationDetails }
          : null,
        viewCount: video.viewCount,
        publishedAt: video.publishedAt,
        isDeleted: video.isDeleted,
        deletedAt: video.deletedAt,
        deletedBy: video.deletedBy,
        deleteReason: video.deleteReason,
        deletionStatus: video.deletionStatus,
        deleteRequestedAt: video.deleteRequestedAt,
        refundCompletedAt: video.refundCompletedAt,
        refundSummary: video.refundSummary,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
        statusChangedAt: video.statusChangedAt,
      });

      await manager.delete(VideoTagOrmEntity, { videoId: video.id });

      if (video.tags.length > 0) {
        await manager.insert(
          VideoTagOrmEntity,
          video.tags.map((tag) => ({
            videoId: video.id,
            tagId: tag.id,
            createdAt: new Date(),
          })),
        );
      }

      await manager.getRepository(OutboxMessageOrmEntity).save({
        id: randomUUID(),
        topic: outboxMessage.topic,
        messageKey: outboxMessage.messageKey,
        payload: outboxMessage.payload,
        status: OutboxMessageStatus.PENDING,
        attemptCount: 0,
        nextAttemptAt: new Date(),
        lockedAt: null,
        publishedAt: null,
        lastError: null,
      });
    });
  }
}
