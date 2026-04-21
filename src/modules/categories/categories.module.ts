import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateCategoryUseCase } from './application/use-cases/create-category.use-case';
import { GetCategoriesUseCase } from './application/use-cases/get-categories.use-case';
import { CATEGORY_REPOSITORY } from './domain/repositories/category.repository';
import { DefaultCategoryBootstrap } from './infrastructure/default-category.bootstrap';
import { CategoryOrmEntity } from './infrastructure/persistence/category.orm-entity';
import { CategoryRepositoryImpl } from './infrastructure/persistence/category.repository.impl';
import { CategoryController } from './presentation/controllers/category.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryOrmEntity])],
  controllers: [CategoryController],
  providers: [
    CategoryRepositoryImpl,
    CreateCategoryUseCase,
    GetCategoriesUseCase,
    DefaultCategoryBootstrap,
    {
      provide: CATEGORY_REPOSITORY,
      useExisting: CategoryRepositoryImpl,
    },
  ],
  exports: [CATEGORY_REPOSITORY],
})
export class CategoriesModule {}
