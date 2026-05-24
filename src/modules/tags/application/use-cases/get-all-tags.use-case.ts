import { Inject, Injectable } from '@nestjs/common';
import {
  createPagination,
  type PaginatedResponse,
} from '@shared/application/dtos/paginated.response';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  TAG_REPOSITORY,
  type ITagRepository,
} from '../../domain/repositories/tag.repository';
import type { TagResponse } from '../dto/tag.response';
import { toTagResponse } from '../mappers/tag-response.mapper';

@Injectable()
export class GetAllTagsUseCase extends BaseUseCase<
  { q?: string; page: number; limit: number },
  PaginatedResponse<TagResponse>
> {
  constructor(
    @Inject(TAG_REPOSITORY)
    private readonly tagRepository: ITagRepository,
  ) {
    super();
  }

  async execute(input: {
    q?: string;
    page: number;
    limit: number;
  }): Promise<PaginatedResponse<TagResponse>> {
    const result = input.q
      ? await this.tagRepository.searchAllPaged(
          input.q,
          input.page,
          input.limit,
        )
      : await this.tagRepository.findAllPaged(input.page, input.limit);

    return {
      items: result.items.map(toTagResponse),
      pagination: createPagination(input.page, input.limit, result.total),
    };
  }
}
