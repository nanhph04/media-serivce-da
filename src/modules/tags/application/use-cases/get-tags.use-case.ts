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

export interface GetTagsQuery {
  q?: string;
  page: number;
  limit: number;
}

@Injectable()
export class GetTagsUseCase extends BaseUseCase<
  GetTagsQuery,
  PaginatedResponse<TagResponse>
> {
  constructor(
    @Inject(TAG_REPOSITORY)
    private readonly tagRepository: ITagRepository,
  ) {
    super();
  }

  async execute(input: GetTagsQuery): Promise<PaginatedResponse<TagResponse>> {
    const result = input.q
      ? await this.tagRepository.searchActivePaged(
          input.q,
          input.page,
          input.limit,
        )
      : await this.tagRepository.findActivePaged(input.page, input.limit);

    return {
      items: result.items.map(toTagResponse),
      pagination: createPagination(input.page, input.limit, result.total),
    };
  }
}
