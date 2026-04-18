import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CATEGORY_REPOSITORY } from './domain/repositories/category.repository';
import { DefaultCategoryBootstrap } from './infrastructure/default-category.bootstrap';
import { CategoryOrmEntity } from './infrastructure/persistence/category.orm-entity';
import { CategoryRepositoryImpl } from './infrastructure/persistence/category.repository.impl';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryOrmEntity])],
  providers: [
    CategoryRepositoryImpl,
    DefaultCategoryBootstrap,
    {
      provide: CATEGORY_REPOSITORY,
      useExisting: CategoryRepositoryImpl,
    },
  ],
  exports: [CATEGORY_REPOSITORY],
})
export class CategoriesModule {}
