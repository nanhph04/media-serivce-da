import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  CategoryStatus,
  type Category,
} from '../../../categories/domain/entities/category.entity';
import {
  CATEGORY_REPOSITORY,
  type ICategoryRepository,
} from '../../../categories/domain/repositories/category.repository';
import { TagStatus, type Tag } from '../../../tags/domain/entities/tag.entity';
import {
  TAG_REPOSITORY,
  type ITagRepository,
} from '../../../tags/domain/repositories/tag.repository';
import type { UpdateVideoMetadataCommand } from '../dtos/update-video-metadata.command';
import type { VideoMetadataResponse } from '../dtos/video-metadata.response';
import {
  type IVideoCacheInvalidator,
  VIDEO_CACHE_INVALIDATOR,
} from '../interfaces/video-cache-invalidator.interface';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';

@Injectable()
export class UpdateVideoMetadataUseCase extends BaseUseCase<
  UpdateVideoMetadataCommand,
  VideoMetadataResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(VIDEO_CACHE_INVALIDATOR)
    private readonly videoCacheInvalidator: IVideoCacheInvalidator,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
    @Inject(TAG_REPOSITORY)
    private readonly tagRepository: ITagRepository,
  ) {
    super();
  }

  async execute(
    command: UpdateVideoMetadataCommand,
  ): Promise<VideoMetadataResponse> {
    const video = await this.videoRepository.findById(command.videoId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.ownerId !== command.userId) {
      throw new ForbiddenException('You do not own this video');
    }

    const category = await this.resolveCategory(command.categoryId);
    const tags = await this.resolveTags(command.tagIds);

    video.updateMetadata({
      title: command.title,
      description: command.description,
      thumbnailUrl: command.thumbnailUrl,
      category,
      tags,
    });

    await this.videoRepository.save(video);
    await this.videoCacheInvalidator.invalidateMetadata(video.id);

    return {
      id: video.id,
      title: video.title,
      description: video.description,
      categoryId: video.category.id,
      category: video.category.slug,
      tagIds: video.tags.map((tag) => tag.id),
      tags: video.tags.map((tag) => tag.slug),
      thumbnailUrl: video.thumbnailUrl,
      viewCount: video.viewCount,
      status: video.status,
      visibility: video.visibility,
      errorMessage: video.errorMessage,
      publishedAt: video.publishedAt,
      isDeleted: video.isDeleted,
      deletedAt: video.deletedAt,
      deletedBy: video.deletedBy,
      deleteReason: video.deleteReason,
      updatedAt: video.updatedAt,
    };
  }

  private async resolveCategory(
    categoryId: string | undefined,
  ): Promise<Category | undefined> {
    if (categoryId === undefined) {
      return undefined;
    }

    const category = await this.categoryRepository.findById(categoryId);

    if (!category || category.status !== CategoryStatus.ACTIVE) {
      throw new BadRequestException('Category is invalid');
    }

    return category;
  }

  private async resolveTags(
    tagIds: string[] | undefined,
  ): Promise<Tag[] | undefined> {
    if (tagIds === undefined) {
      return undefined;
    }

    const normalizedTagIds = [
      ...new Set(tagIds.map((tagId) => tagId.trim()).filter(Boolean)),
    ];

    if (normalizedTagIds.length !== tagIds.length) {
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
