import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { ConflictException } from '@shared/domain/exceptions/domain.exception';
import { Tag, TagStatus } from '../../domain/entities/tag.entity';
import {
  TAG_REPOSITORY,
  type ITagRepository,
} from '../../domain/repositories/tag.repository';
import type { CreateTagCommand } from '../dto/create-tag.command';
import type { TagResponse } from '../dto/tag.response';
import { toTagResponse } from '../mappers/tag-response.mapper';

@Injectable()
export class CreateTagUseCase extends BaseUseCase<
  CreateTagCommand,
  TagResponse
> {
  constructor(
    @Inject(TAG_REPOSITORY)
    private readonly tagRepository: ITagRepository,
  ) {
    super();
  }

  async execute(input: CreateTagCommand): Promise<TagResponse> {
    const name = input.name.trim();
    const slug = Tag.convertNameToSlug(name);
    const existingTag = await this.tagRepository.findBySlug(slug);

    if (existingTag) {
      throw new ConflictException('Tag already exists');
    }

    const tag = Tag.create({ name, status: TagStatus.ACTIVE });
    await this.tagRepository.save(tag);

    return toTagResponse(tag);
  }
}
