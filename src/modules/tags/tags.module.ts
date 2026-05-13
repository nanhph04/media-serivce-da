import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateTagUseCase } from './application/use-cases/create-tag.use-case';
import { GetAllTagsUseCase } from './application/use-cases/get-all-tags.use-case';
import { GetTagsUseCase } from './application/use-cases/get-tags.use-case';
import { UpdateTagUseCase } from './application/use-cases/update-tag.use-case';
import { TAG_REPOSITORY } from './domain/repositories/tag.repository';
import { DefaultTagBootstrap } from './infrastructure/default-tag.bootstrap';
import { TagOrmEntity } from './infrastructure/persistence/tag.orm-entity';
import { TagRepositoryImpl } from './infrastructure/persistence/tag.repository.impl';
import { TagController } from './presentation/controllers/tag.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TagOrmEntity])],
  controllers: [TagController],
  providers: [
    TagRepositoryImpl,
    CreateTagUseCase,
    GetAllTagsUseCase,
    GetTagsUseCase,
    UpdateTagUseCase,
    DefaultTagBootstrap,
    {
      provide: TAG_REPOSITORY,
      useExisting: TagRepositoryImpl,
    },
  ],
  exports: [TAG_REPOSITORY],
})
export class TagsModule {}
