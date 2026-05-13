import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  OBJECT_STORAGE_SERVICE,
  type IObjectStorageService,
} from '@shared/application/interfaces/object-storage.service.interface';
import { BadRequestException } from '@shared/domain/exceptions/domain.exception';
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
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
    @Inject(CHANNEL_ACCESS_SERVICE)
    private readonly channelAccessService: IChannelAccessService,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService: IObjectStorageService,
    @Inject(TAG_REPOSITORY)
    private readonly tagRepository: ITagRepository,
  ) {
    super();
  }

  async execute(
    command: InitVideoUploadCommand,
  ): Promise<InitVideoUploadResponse> {
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

    await this.videoRepository.save(video);

    return {
      videoId: video.id,
      status: video.status,
      rawFileKey,
      bucket: this.objectStorageService.getBucketName('raw'),
      uploadUrl: await this.objectStorageService.createUploadUrl(
        'raw',
        rawFileKey,
      ),
    };
  }

  private async resolveCategory(categoryId: string): Promise<Category> {
    const normalizedCategoryId = categoryId.trim();

    if (!normalizedCategoryId) {
      throw new BadRequestException('Exactly one category is required');
    }

    const category = await this.categoryRepository.findById(
      normalizedCategoryId,
    );

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
