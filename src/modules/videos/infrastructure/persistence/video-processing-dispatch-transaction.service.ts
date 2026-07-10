import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource, type EntityManager } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import {
  VideoStatus,
  type VideoEntity,
} from '../../domain/entities/video.entity';
import type {
  IVideoProcessingDispatchTransaction,
  VideoProcessingDispatchMessage,
} from '../../application/interfaces/video-processing-dispatch-transaction.interface';
import { VideoOrmEntity } from './video.orm-entity';
import { VideoTagOrmEntity } from './video-tag.orm-entity';
import { VideoProcessingDispatchStatus } from './video-processing-dispatch.orm-entity';

@Injectable()
export class VideoProcessingDispatchTransactionService
  implements IVideoProcessingDispatchTransaction
{
  constructor(private readonly dataSource: DataSource) {}

  async saveVideoWithProcessingDispatch(
    video: VideoEntity,
    dispatch: VideoProcessingDispatchMessage,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.save(VideoOrmEntity, this.toOrmPersistence(video));

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

      await this.insertDispatch(manager, video, dispatch);
    });
  }

  async saveVideoWithProcessingDispatchIfStatus(
    video: VideoEntity,
    dispatch: VideoProcessingDispatchMessage,
    expectedStatus: VideoStatus,
  ): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const result = await manager.update(
        VideoOrmEntity,
        { id: video.id, status: expectedStatus },
        this.toOrmMutableFields(video) as QueryDeepPartialEntity<VideoOrmEntity>,
      );

      if (!result.affected) {
        return false;
      }

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

      await this.insertDispatch(manager, video, dispatch);

      return true;
    });
  }

  private async insertDispatch(
    manager: EntityManager,
    video: VideoEntity,
    dispatch: VideoProcessingDispatchMessage,
  ): Promise<void> {
    await manager.query(
      `
        INSERT INTO "video_processing_dispatches" (
          "id",
          "video_id",
          "job_id",
          "payload",
          "status",
          "attempt_count",
          "next_attempt_at",
          "locked_at",
          "dispatched_at",
          "last_error"
        ) VALUES ($1, $2, $3, $4, $5, 0, $6, NULL, NULL, NULL)
        ON CONFLICT ("job_id") DO NOTHING
      `,
      [
        randomUUID(),
        video.id,
        dispatch.jobId,
        dispatch.payload,
        VideoProcessingDispatchStatus.PENDING,
        new Date(),
      ],
    );
  }

  private toOrmPersistence(video: VideoEntity): Partial<VideoOrmEntity> {
    return {
      id: video.id,
      ...this.toOrmMutableFields(video),
      createdAt: video.createdAt,
    };
  }

  private toOrmMutableFields(video: VideoEntity): Partial<VideoOrmEntity> {
    return {
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
      storageDeletedAt: video.storageDeletedAt,
      updatedAt: video.updatedAt,
      statusChangedAt: video.statusChangedAt,
    };
  }
}
