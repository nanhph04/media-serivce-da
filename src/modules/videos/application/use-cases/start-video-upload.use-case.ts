import { Inject, Injectable } from '@nestjs/common';
import {
  OBJECT_STORAGE_SERVICE,
  type IObjectStorageService,
} from '@shared/application/interfaces/object-storage.service.interface';
import {
  VIDEO_UPLOAD_CONFIG,
  type IVideoUploadConfig,
} from '@shared/application/interfaces/video-upload-config.interface';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { BadRequestException } from '@shared/domain/exceptions/domain.exception';
import {
  CategoryStatus,
  type Category,
} from '../../../categories/domain/entities/category.entity';
import {
  CATEGORY_REPOSITORY,
  type ICategoryRepository,
} from '../../../categories/domain/repositories/category.repository';
import {
  CHANNEL_ACCESS_SERVICE,
  type IChannelAccessService,
} from '../../../channels/application/interfaces/channel-access.service.interface';
import { TagStatus, type Tag } from '../../../tags/domain/entities/tag.entity';
import {
  TAG_REPOSITORY,
  type ITagRepository,
} from '../../../tags/domain/repositories/tag.repository';
import { VideoEntity } from '../../domain/entities/video.entity';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import {
  type IVideoUploadSessionRepository,
  VIDEO_UPLOAD_SESSION_REPOSITORY,
} from '../../domain/repositories/video-upload-session.repository';
import type { StartVideoUploadCommand } from '../dtos/start-video-upload.command';
import type { StartVideoUploadResponse } from '../dtos/start-video-upload.response';

const MULTIPART_UPLOAD_PART_SIZE_BYTES = 16 * 1024 * 1024;
const MULTIPART_UPLOAD_TTL_HOURS = 24;

@Injectable()
export class StartVideoUploadUseCase extends BaseUseCase<
  StartVideoUploadCommand,
  StartVideoUploadResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
    @Inject(CHANNEL_ACCESS_SERVICE)
    private readonly channelAccessService: IChannelAccessService,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService: IObjectStorageService,
    @Inject(TAG_REPOSITORY)
    private readonly tagRepository: ITagRepository,
    @Inject(VIDEO_UPLOAD_SESSION_REPOSITORY)
    private readonly uploadSessionRepository: IVideoUploadSessionRepository,
    @Inject(VIDEO_UPLOAD_CONFIG)
    private readonly videoUploadConfig: IVideoUploadConfig,
  ) {
    super();
  }

  async execute(
    command: StartVideoUploadCommand,
  ): Promise<StartVideoUploadResponse> {
    if (command.fileSize <= 0) {
      throw new BadRequestException(
        'Video file size must be greater than zero',
      );
    }

    const maxVideoUploadSizeBytes =
      this.videoUploadConfig.getMaxVideoUploadSizeBytes();
    if (command.fileSize > maxVideoUploadSizeBytes) {
      throw new BadRequestException('Video file exceeds maximum upload size');
    }

    const channelId = await this.channelAccessService.getOwnedActiveChannelId(
      command.userId,
    );
    const rawFileKey = `uploads/raw/${channelId}/${Date.now()}-${crypto.randomUUID()}.mp4`;
    const category = await this.resolveCategory(command.categoryId);
    const tags = await this.resolveTags(command.tagIds);
    const video = VideoEntity.create({
      channelId,
      ownerId: command.userId,
      title: command.title,
      description: command.description,
      category,
      tags,
      visibility: command.visibility,
      price: command.price,
      requiredTierLevel: command.requiredTierLevel,
      rawFileKey,
    });
    const thumbnailObjectKey = this.createThumbnailObjectKey(
      video.id,
      command.thumbnailExtension,
    );

    await this.videoRepository.save(video);
    const uploadId = await this.objectStorageService.createMultipartUpload(
      'raw',
      rawFileKey,
    );

    const expiresAt = new Date(
      Date.now() + MULTIPART_UPLOAD_TTL_HOURS * 60 * 60 * 1000,
    );
    await this.uploadSessionRepository.create({
      videoId: video.id,
      userId: command.userId,
      rawFileKey,
      uploadId,
      partSizeBytes: MULTIPART_UPLOAD_PART_SIZE_BYTES,
      fileName: command.fileName,
      fileSize: command.fileSize,
      fileLastModified: command.fileLastModified,
      expiresAt,
    });

    return {
      videoId: video.id,
      status: video.status,
      rawFileKey,
      bucket: this.objectStorageService.getBucketName('raw'),
      uploadId,
      partSizeBytes: MULTIPART_UPLOAD_PART_SIZE_BYTES,
      expiresAt: expiresAt.toISOString(),
      thumbnailObjectKey,
      thumbnailBucket: thumbnailObjectKey
        ? this.objectStorageService.getBucketName('public')
        : null,
      thumbnailUploadUrl: thumbnailObjectKey
        ? await this.objectStorageService.createUploadUrl(
            'public',
            thumbnailObjectKey,
          )
        : null,
    };
  }

  private createThumbnailObjectKey(
    videoId: string,
    extension?: string,
  ): string | null {
    if (!extension) {
      return null;
    }

    return `videos/${videoId}/thumbnails/custom.${extension}`;
  }

  private async resolveCategory(categoryId: string): Promise<Category> {
    const normalizedCategoryId = categoryId.trim();
    if (!normalizedCategoryId) {
      throw new BadRequestException('Exactly one category is required');
    }

    const category =
      await this.categoryRepository.findById(normalizedCategoryId);
    if (!category || category.status !== CategoryStatus.ACTIVE) {
      throw new BadRequestException('Category is invalid');
    }

    return category;
  }

  private async resolveTags(tagIds: string[]): Promise<Tag[]> {
    const sourceTagIds = tagIds ?? [];
    const normalizedTagIds = [
      ...new Set(sourceTagIds.map((tagId) => tagId.trim()).filter(Boolean)),
    ];

    if (normalizedTagIds.length !== sourceTagIds.length) {
      throw new BadRequestException('Duplicate tags are not allowed');
    }

    if (normalizedTagIds.length === 0) {
      return [];
    }

    const tags = await this.tagRepository.findByIds(normalizedTagIds);
    if (
      tags.length !== normalizedTagIds.length ||
      tags.some((tag) => tag.status !== TagStatus.ACTIVE)
    ) {
      throw new BadRequestException('One or more tags are invalid');
    }

    return tags;
  }
}
