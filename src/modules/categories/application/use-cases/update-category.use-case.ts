import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  ConflictException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  Category,
  CategoryStatus,
} from '../../domain/entities/category.entity';
import {
  CATEGORY_REPOSITORY,
  type ICategoryRepository,
} from '../../domain/repositories/category.repository';
import type { CategoryResponse } from '../dto/category.response';
import type { UpdateCategoryCommand } from '../dto/update-category.command';

@Injectable()
export class UpdateCategoryUseCase extends BaseUseCase<
  UpdateCategoryCommand,
  CategoryResponse
> {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {
    super();
  }

  async execute(input: UpdateCategoryCommand): Promise<CategoryResponse> {
    const category = await this.categoryRepository.findById(input.categoryId);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (input.name !== undefined) {
      const normalizedName = input.name.trim();
      const slug = Category.convertNameToSlug(normalizedName);
      const existingCategory = await this.categoryRepository.findBySlug(slug);

      if (existingCategory && existingCategory.id !== category.id) {
        throw new ConflictException('Category already exists');
      }
    }

    category.update({
      name: input.name,
      ...(input.description !== undefined
        ? { description: input.description.trim() || null }
        : {}),
    });
    category.updateSettings({
      parentId: input.parentId,
      displayOrder: input.displayOrder,
      status: parseCategoryStatus(input.status),
    });

    await this.categoryRepository.save(category);

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? undefined,
      parentId: category.parentId,
      status: category.status,
      displayOrder: category.displayOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}

function parseCategoryStatus(
  status: string | undefined,
): CategoryStatus | undefined {
  if (status === undefined) {
    return undefined;
  }

  if (!Object.values(CategoryStatus).includes(status as CategoryStatus)) {
    throw new ConflictException('Invalid category status');
  }

  return status as CategoryStatus;
}
