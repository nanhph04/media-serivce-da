import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import { Tag, TagStatus } from '../../domain/entities/tag.entity';
import {
  TAG_REPOSITORY,
  type ITagRepository,
} from '../../domain/repositories/tag.repository';
import type { TagResponse } from '../dto/tag.response';
import type { UpdateTagCommand } from '../dto/update-tag.command';
import { toTagResponse } from '../mappers/tag-response.mapper';

@Injectable()
export class UpdateTagUseCase extends BaseUseCase<
  UpdateTagCommand,
  TagResponse
> {
  constructor(
    @Inject(TAG_REPOSITORY)
    private readonly tagRepository: ITagRepository,
  ) {
    super();
  }

  async execute(input: UpdateTagCommand): Promise<TagResponse> {
    const tag = await this.tagRepository.findById(input.tagId);

    if (!tag) {
      throw new NotFoundException(ERROR_MESSAGES.TAG_NOT_FOUND);
    }

    if (input.name !== undefined) {
      const slug = Tag.convertNameToSlug(input.name.trim());
      const existingTag = await this.tagRepository.findBySlug(slug);

      if (existingTag && existingTag.id !== tag.id) {
        throw new ConflictException(ERROR_MESSAGES.TAG_ALREADY_EXISTS);
      }
    }

    tag.update({
      name: input.name,
      status: parseTagStatus(input.status),
    });

    await this.tagRepository.save(tag);

    return toTagResponse(tag);
  }
}

function parseTagStatus(status: string | undefined): TagStatus | undefined {
  if (status === undefined) {
    return undefined;
  }

  if (!Object.values(TagStatus).includes(status as TagStatus)) {
    throw new BadRequestException(ERROR_MESSAGES.TAG_INVALID_STATUS);
  }

  return status as TagStatus;
}
