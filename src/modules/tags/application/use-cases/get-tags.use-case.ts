import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  TAG_REPOSITORY,
  type ITagRepository,
} from '../../domain/repositories/tag.repository';
import type { TagResponse } from '../dto/tag.response';
import { toTagResponse } from '../mappers/tag-response.mapper';

@Injectable()
export class GetTagsUseCase extends BaseUseCase<{ q?: string }, TagResponse[]> {
  constructor(
    @Inject(TAG_REPOSITORY)
    private readonly tagRepository: ITagRepository,
  ) {
    super();
  }

  async execute(input: { q?: string }): Promise<TagResponse[]> {
    const tags = input.q
      ? await this.tagRepository.searchActive(input.q)
      : await this.tagRepository.findActive();

    return tags.map(toTagResponse);
  }
}
