import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Category, CategoryStatus } from '../domain/entities/category.entity';
import {
  CATEGORY_REPOSITORY,
  type ICategoryRepository,
} from '../domain/repositories/category.repository';

@Injectable()
export class DefaultCategoryBootstrap implements OnModuleInit {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    const defaultSlug = Category.convertNameToSlug('Khác');
    const existing = await this.categoryRepository.findBySlug(defaultSlug);

    if (existing) {
      return;
    }

    await this.categoryRepository.save(
      Category.create({
        name: 'Khác',
        description: 'Danh mục mặc định cho video không khớp thể loại có sẵn',
        status: CategoryStatus.ACTIVE,
      }),
    );
  }
}
