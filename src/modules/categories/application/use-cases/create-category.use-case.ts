import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { ConflictException } from '@shared/domain/exceptions/domain.exception';
import {
  Category,
  CategoryStatus,
} from '../../domain/entities/category.entity';
import {
  CATEGORY_REPOSITORY,
  type ICategoryRepository,
} from '../../domain/repositories/category.repository';
import type { CategoryResponse } from '../dto/category.response';
import type { CreateCategoryCommand } from '../dto/create-category.command';

@Injectable()
export class CreateCategoryUseCase extends BaseUseCase<
  CreateCategoryCommand,
  CategoryResponse
> {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {
    super();
  }

  async execute(input: CreateCategoryCommand): Promise<CategoryResponse> {
    const normalizedName = input.name.trim();
    const normalizedDescription = input.description?.trim() || null;
    const slug = Category.convertNameToSlug(normalizedName);

    const existingCategory = await this.categoryRepository.findBySlug(slug);

    if (existingCategory) {
      throw new ConflictException('Category already exists');
    }

    const category = Category.create({
      name: normalizedName,
      description: normalizedDescription,
      parentId: input.parentId ?? null,
      status: CategoryStatus.ACTIVE,
      displayOrder: input.displayOrder ?? 0,
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
