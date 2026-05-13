import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  TAG_REPOSITORY,
  type ITagRepository,
} from '../../domain/repositories/tag.repository';
import type { TagResponse } from '../dto/tag.response';
import { toTagResponse } from '../mappers/tag-response.mapper';

@Injectable()
export class GetAllTagsUseCase extends BaseUseCase<
  { q?: string },
  TagResponse[]
> {
  constructor(
    @Inject(TAG_REPOSITORY)
    private readonly tagRepository: ITagRepository,
  ) {
    super();
  }

  async execute(input: { q?: string }): Promise<TagResponse[]> {
    const tags = input.q
      ? await this.tagRepository.searchAll(input.q)
      : await this.tagRepository.findAll();

    return tags.map(toTagResponse);
  }
}
