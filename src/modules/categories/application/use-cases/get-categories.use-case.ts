import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  CATEGORY_REPOSITORY,
  type ICategoryRepository,
} from '../../domain/repositories/category.repository';
import type { CategoryResponse } from '../dto/category.response';

export interface GetCategoriesQuery {
  q?: string;
}

@Injectable()
export class GetCategoriesUseCase extends BaseUseCase<
  GetCategoriesQuery | void,
  CategoryResponse[]
> {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {
    super();
  }

  async execute(query?: GetCategoriesQuery): Promise<CategoryResponse[]> {
    const keyword = query?.q?.trim();
    const categories = keyword
      ? await this.categoryRepository.searchActive(keyword)
      : await this.categoryRepository.findActive();

    return categories.map(
      (category): CategoryResponse => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description ?? undefined,
        status: category.status,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      }),
    );
  }
}
