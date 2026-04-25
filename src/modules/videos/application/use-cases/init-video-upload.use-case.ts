import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  InternalServerErrorException,
} from '@shared/domain/exceptions/domain.exception';
import { MinioService } from '@shared/infrastructure/storage/minio.service';
import {
  CATEGORY_REPOSITORY,
  type ICategoryRepository,
} from '../../../categories/domain/repositories/category.repository';
import { Category } from '../../../categories/domain/entities/category.entity';
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
    private readonly minioService: MinioService,
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
    const categories = await this.resolveCategories(command.categories);
    const video = VideoEntity.create({
      channelId,
      ownerId: command.userId,
      title: command.title,
      description: command.description,
      category: categories,
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

  private async resolveCategories(slugs: string[]): Promise<Category[]> {
    const normalizedSlugs = [...new Set(slugs.map((slug) => slug.trim()).filter(Boolean))];
    const matchedCategories =
      await this.categoryRepository.findBySlugs(normalizedSlugs);

    if (matchedCategories.length > 0) {
      return matchedCategories;
    }

    const fallbackSlug = Category.convertNameToSlug('Khác');
    const fallbackCategory = await this.categoryRepository.findBySlug(
      fallbackSlug,
    );

    if (!fallbackCategory) {
      throw new InternalServerErrorException(
        'Default category does not exist',
      );
    }

    return [fallbackCategory];
  }
}
