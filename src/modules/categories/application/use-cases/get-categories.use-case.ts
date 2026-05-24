import { Inject, Injectable } from '@nestjs/common';
import {
  createPagination,
  type PaginatedResponse,
} from '@shared/application/dtos/paginated.response';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  CATEGORY_REPOSITORY,
  type ICategoryRepository,
} from '../../domain/repositories/category.repository';
import type { CategoryResponse } from '../dto/category.response';

export interface GetCategoriesQuery {
  q?: string;
  page: number;
  limit: number;
}

@Injectable()
export class GetCategoriesUseCase extends BaseUseCase<
  GetCategoriesQuery | void,
  PaginatedResponse<CategoryResponse>
> {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {
    super();
  }

  async execute(
    query?: GetCategoriesQuery,
  ): Promise<PaginatedResponse<CategoryResponse>> {
    const keyword = query?.q?.trim();
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const result = keyword
      ? await this.categoryRepository.searchActivePaged(keyword, page, limit)
      : await this.categoryRepository.findActivePaged(page, limit);

    const items = result.items.map(
      (category): CategoryResponse => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description ?? undefined,
        parentId: category.parentId,
        status: category.status,
        displayOrder: category.displayOrder,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      }),
    );

    return {
      items,
      pagination: createPagination(page, limit, result.total),
    };
  }
}
