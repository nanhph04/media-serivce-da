import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { BadRequestException } from '@shared/domain/exceptions/domain.exception';
import {
  CategoryStatus,
  type Category,
} from '../../../categories/domain/entities/category.entity';
import {
  CATEGORY_REPOSITORY,
  type ICategoryRepository,
} from '../../../categories/domain/repositories/category.repository';
import { TagStatus, type Tag } from '../../../tags/domain/entities/tag.entity';
import {
  TAG_REPOSITORY,
  type ITagRepository,
} from '../../../tags/domain/repositories/tag.repository';
import type { GenerateVideoMetadataSuggestionCommand } from '../dtos/generate-video-metadata-suggestion.command';
import type {
  GenerateVideoMetadataSuggestionResponse,
  VideoMetadataSuggestionTagResponse,
} from '../dtos/generate-video-metadata-suggestion.response';
import {
  VIDEO_METADATA_SUGGESTION_GENERATOR,
  type IVideoMetadataSuggestionGenerator,
  type VideoMetadataSuggestionTagInput,
} from '../interfaces/video-metadata-suggestion-generator.interface';

const MIN_DESCRIPTION_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2_000;

@Injectable()
export class GenerateVideoMetadataSuggestionUseCase extends BaseUseCase<
  GenerateVideoMetadataSuggestionCommand,
  GenerateVideoMetadataSuggestionResponse
> {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
    @Inject(TAG_REPOSITORY)
    private readonly tagRepository: ITagRepository,
    @Inject(VIDEO_METADATA_SUGGESTION_GENERATOR)
    private readonly metadataSuggestionGenerator: IVideoMetadataSuggestionGenerator,
  ) {
    super();
  }

  async execute(
    command: GenerateVideoMetadataSuggestionCommand,
  ): Promise<GenerateVideoMetadataSuggestionResponse> {
    const title = command.title.trim();
    if (!title) {
      throw new BadRequestException(
        ERROR_MESSAGES.VIDEO_TITLE_REQUIRED_MAX_LENGTH,
      );
    }

    const maxDescriptionLength = this.normalizeMaxDescriptionLength(
      command.maxDescriptionLength,
    );
    const category = await this.resolveCategory(command.categoryId);
    const selectedTags = await this.resolveSelectedTags(command.tagIds);
    const allowedTags = (await this.tagRepository.findActive()).map((tag) =>
      this.toSuggestionTagInput(tag),
    );

    const suggestion = await this.metadataSuggestionGenerator.generate({
      title,
      description: command.description?.trim() ?? '',
      categoryName: category.name,
      categorySlug: category.slug,
      selectedTags: selectedTags.map((tag) => this.toSuggestionTagInput(tag)),
      allowedTags,
      language: command.language,
      tone: command.tone,
      maxDescriptionLength,
      traceId: command.traceId,
    });

    const suggestedTags = this.resolveSuggestedTags(
      suggestion.suggestedTagSlugs,
      allowedTags,
    );

    return {
      title: this.requireNonEmpty(
        suggestion.title,
        'AI generated title is empty',
      ),
      description: this.requireNonEmpty(
        suggestion.description,
        'AI generated description is empty',
      ),
      hashtags: this.normalizeHashtags(suggestion.hashtags),
      suggestedTags,
      provider: suggestion.provider,
      model: suggestion.model,
    };
  }

  private normalizeMaxDescriptionLength(maxDescriptionLength: number): number {
    if (
      maxDescriptionLength < MIN_DESCRIPTION_LENGTH ||
      maxDescriptionLength > MAX_DESCRIPTION_LENGTH
    ) {
      throw new BadRequestException(
        `maxDescriptionLength must be between ${MIN_DESCRIPTION_LENGTH} and ${MAX_DESCRIPTION_LENGTH}`,
      );
    }

    return maxDescriptionLength;
  }

  private async resolveCategory(categoryId: string): Promise<Category> {
    const normalizedCategoryId = categoryId.trim();
    if (!normalizedCategoryId) {
      throw new BadRequestException(
        ERROR_MESSAGES.EXACTLY_ONE_CATEGORY_REQUIRED,
      );
    }

    const category =
      await this.categoryRepository.findById(normalizedCategoryId);
    if (!category || category.status !== CategoryStatus.ACTIVE) {
      throw new BadRequestException(ERROR_MESSAGES.CATEGORY_INVALID);
    }

    return category;
  }

  private async resolveSelectedTags(tagIds: string[]): Promise<Tag[]> {
    const sourceTagIds = tagIds ?? [];
    const normalizedTagIds = [
      ...new Set(sourceTagIds.map((tagId) => tagId.trim()).filter(Boolean)),
    ];

    if (normalizedTagIds.length !== sourceTagIds.length) {
      throw new BadRequestException(ERROR_MESSAGES.DUPLICATE_TAGS_NOT_ALLOWED);
    }

    if (normalizedTagIds.length === 0) {
      return [];
    }

    const tags = await this.tagRepository.findByIds(normalizedTagIds);
    if (
      tags.length !== normalizedTagIds.length ||
      tags.some((tag) => tag.status !== TagStatus.ACTIVE)
    ) {
      throw new BadRequestException(ERROR_MESSAGES.ONE_OR_MORE_TAGS_INVALID);
    }

    return tags;
  }

  private toSuggestionTagInput(tag: Tag): VideoMetadataSuggestionTagInput {
    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    };
  }

  private resolveSuggestedTags(
    suggestedTagSlugs: string[],
    allowedTags: VideoMetadataSuggestionTagInput[],
  ): VideoMetadataSuggestionTagResponse[] {
    const allowedBySlug = new Map(
      allowedTags.map((tag) => [tag.slug, tag] as const),
    );
    const uniqueSlugs = [
      ...new Set(suggestedTagSlugs.map((slug) => slug.trim()).filter(Boolean)),
    ];

    return uniqueSlugs
      .map((slug) => allowedBySlug.get(slug))
      .filter(
        (tag): tag is VideoMetadataSuggestionTagInput => tag !== undefined,
      )
      .map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
      }));
  }

  private normalizeHashtags(hashtags: string[]): string[] {
    return [
      ...new Set(
        hashtags
          .map((hashtag) => hashtag.trim())
          .filter(Boolean)
          .map((hashtag) =>
            hashtag.startsWith('#') ? hashtag : `#${hashtag}`,
          ),
      ),
    ].slice(0, 10);
  }

  private requireNonEmpty(value: string, errorMessage: string): string {
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      throw new BadRequestException(errorMessage);
    }

    return normalizedValue;
  }
}
