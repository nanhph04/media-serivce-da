import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  NotFoundException,
  BadRequestException,
} from '@shared/domain/exceptions/domain.exception';
import { CategoryStatus } from '../../../categories/domain/entities/category.entity';
import {
  CATEGORY_REPOSITORY,
  type ICategoryRepository,
} from '../../../categories/domain/repositories/category.repository';
import type { GetVideosByCategoryQuery } from '../dtos/videos-by-category.query';
import type { VideosByCategoryResponse } from '../dtos/videos-by-category.response';
import {
  type IVideoQueryService,
  VIDEO_QUERY_SERVICE,
} from '../interfaces/video-query.service.interface';

@Injectable()
export class GetVideosByCategoryUseCase extends BaseUseCase<
  GetVideosByCategoryQuery,
  VideosByCategoryResponse
> {
  constructor(
    @Inject(VIDEO_QUERY_SERVICE)
    private readonly videoQueryService: IVideoQueryService,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {
    super();
  }

  async execute(
    query: GetVideosByCategoryQuery,
  ): Promise<VideosByCategoryResponse> {
    const normalizedCategory = query.category?.trim() ?? '';

    if (!normalizedCategory) {
      throw new BadRequestException(ERROR_MESSAGES.CATEGORY_REQUIRED);
    }

    const category =
      await this.categoryRepository.findBySlug(normalizedCategory);

    if (!category || category.status !== CategoryStatus.ACTIVE) {
      throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
    }

    return this.videoQueryService.getVideosByCategory(
      normalizedCategory,
      query.page,
      query.limit,
    );
  }
}
