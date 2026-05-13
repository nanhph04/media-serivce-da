import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Category, CategoryStatus } from '../domain/entities/category.entity';
import {
  CATEGORY_REPOSITORY,
  type ICategoryRepository,
} from '../domain/repositories/category.repository';

const DEFAULT_CATEGORIES = [
  'Anime',
  'Am nhac',
  'Phim ngan',
  'Truyen audio',
  'Podcast',
  'Vlog',
  'Giao duc',
  'Review',
  'Giai tri',
  'Khac',
];

@Injectable()
export class DefaultCategoryBootstrap implements OnModuleInit {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const [index, name] of DEFAULT_CATEGORIES.entries()) {
      const slug = Category.convertNameToSlug(name);
      const existing = await this.categoryRepository.findBySlug(slug);

      if (existing) {
        continue;
      }

      await this.categoryRepository.save(
        Category.create({
          name,
          description: null,
          parentId: null,
          status: CategoryStatus.ACTIVE,
          displayOrder: index,
        }),
      );
    }
  }
}
