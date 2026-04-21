import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  CATEGORY_REPOSITORY,
  type ICategoryRepository,
} from '../../domain/repositories/category.repository';
import type { CategoryResponse } from '../dto/category.response';

@Injectable()
export class GetCategoriesUseCase extends BaseUseCase<
  void,
  CategoryResponse[]
> {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {
    super();
  }

  async execute(): Promise<CategoryResponse[]> {
    const categories = await this.categoryRepository.findAll();

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
