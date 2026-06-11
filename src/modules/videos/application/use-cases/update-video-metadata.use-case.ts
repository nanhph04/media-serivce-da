import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import {
  OBJECT_STORAGE_SERVICE,
  type IObjectStorageService,
} from '@shared/application/interfaces/object-storage.service.interface';
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
import {
  CHANNEL_REPOSITORY,
  type IChannelRepository,
} from '../../../channels/domain/repositories/channel.repository';
import { buildChannelAvatarUrl } from '../../../channels/application/dtos/channel-image-url';
import {
  MEMBERSHIP_TIER_REPOSITORY,
  type IMembershipTierRepository,
} from '../../../channels/domain/repositories/membership-tier.repository';
import type { UpdateVideoMetadataCommand } from '../dtos/update-video-metadata.command';
import type { VideoMetadataResponse } from '../dtos/video-metadata.response';
import { mapVideoStatusToJobFields } from '../dtos/video-job-status';
import { buildOwnerThumbnailUrl } from '../dtos/thumbnail-url';
import {
  type IVideoCacheInvalidator,
  VIDEO_CACHE_INVALIDATOR,
} from '../interfaces/video-cache-invalidator.interface';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import { VideoVisibility } from '../../domain/entities/video.entity';

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
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
    @Inject(MEMBERSHIP_TIER_REPOSITORY)
    private readonly membershipTierRepository: IMembershipTierRepository,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService?: IObjectStorageService,
  ) {
    super();
  }

  async execute(
    command: UpdateVideoMetadataCommand,
  ): Promise<VideoMetadataResponse> {
    const video = await this.videoRepository.findById(command.videoId);
    if (!video) {
      throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    }

    if (video.ownerId !== command.userId) {
      throw new ForbiddenException(ERROR_MESSAGES.VIDEO_NOT_OWNED);
    }

    const category = await this.resolveCategory(command.categoryId);
    const tags = await this.resolveTags(command.tagIds);

    video.updateMetadata({
      title: command.title,
      description: command.description,
      thumbnailUrl: command.thumbnailUrl,
      category,
      tags,
      visibility: this.resolveVisibility(command.visibility),
      price: command.price,
      requiredTierLevel: command.requiredTierLevel,
    });

    await this.videoRepository.save(video);
    await this.videoCacheInvalidator.invalidateMetadata(video.id);

    const channel = await this.channelRepository.findById(video.channelId);
    if (!channel) {
      throw new NotFoundException(ERROR_MESSAGES.CHANNEL_NOT_FOUND);
    }
    const membershipTiers = await this.membershipTierRepository.findByChannelId(
      video.channelId,
    );

    return {
      id: video.id,
      channelId: video.channelId,
      channelName: channel.name,
      avatarUrlChannel: buildChannelAvatarUrl(
        channel,
        this.objectStorageService,
      ),
      membershipTiers,
      title: video.title,
      description: video.description,
      categoryId: video.category.id,
      category: video.category.slug,
      tagIds: video.tags.map((tag) => tag.id),
      tags: video.tags.map((tag) => tag.slug),
      thumbnailUrl: buildOwnerThumbnailUrl(video, this.objectStorageService),
      thumbnailSource: video.thumbnailSource,
      thumbnailStatus: video.thumbnailStatus,
      viewCount: video.viewCount,
      price: video.price,
      requiredTierLevel: video.requiredTierLevel,
      status: video.status,
      visibility: video.visibility,
      processingWarnings: video.processingWarnings,
      errorMessage: video.errorMessage,
      ...mapVideoStatusToJobFields({
        status: video.status,
        errorMessage: video.errorMessage,
        moderationDetails: video.moderationDetails,
      }),
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
      throw new BadRequestException(ERROR_MESSAGES.CATEGORY_INVALID);
    }

    return category;
  }

  private resolveVisibility(
    visibility: string | undefined,
  ): VideoVisibility | undefined {
    if (visibility === undefined) {
      return undefined;
    }

    if (
      !Object.values(VideoVisibility).includes(visibility as VideoVisibility)
    ) {
      throw new BadRequestException(ERROR_MESSAGES.VIDEO_VISIBILITY_IS_INVALID);
    }

    return visibility as VideoVisibility;
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
      throw new BadRequestException(ERROR_MESSAGES.DUPLICATE_TAGS_NOT_ALLOWED);
    }

    if (normalizedTagIds.length === 0) {
      return [];
    }

    const tags = await this.tagRepository.findByIds(normalizedTagIds);

    if (
      tags.length !== normalizedTagIds.length ||
      tags.some((tag) => tag.status !== TagStatus.ACTIVE)
    ) {
      throw new BadRequestException(ERROR_MESSAGES.ONE_OR_MORE_TAGS_INVALID);
    }

    return tags;
  }
}
