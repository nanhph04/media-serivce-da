import { BadRequestException } from '@shared/domain/exceptions/domain.exception';
import { CategoryStatus } from '../../../categories/domain/entities/category.entity';
import { TagStatus } from '../../../tags/domain/entities/tag.entity';
import { GenerateVideoMetadataSuggestionUseCase } from './generate-video-metadata-suggestion.use-case';

describe('GenerateVideoMetadataSuggestionUseCase', () => {
  const categoryRepository = {
    findById: jest.fn(),
  };
  const tagRepository = {
    findByIds: jest.fn(),
    findActive: jest.fn(),
  };
  const generator = {
    generate: jest.fn(),
  };
  const useCase = new GenerateVideoMetadataSuggestionUseCase(
    categoryRepository as never,
    tagRepository as never,
    generator as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    categoryRepository.findById.mockResolvedValue({
      id: 'category-1',
      name: 'Programming',
      slug: 'programming',
      status: CategoryStatus.ACTIVE,
    });
    tagRepository.findByIds.mockResolvedValue([
      {
        id: 'tag-1',
        name: 'Backend',
        slug: 'backend',
        status: TagStatus.ACTIVE,
      },
    ]);
    tagRepository.findActive.mockResolvedValue([
      {
        id: 'tag-1',
        name: 'Backend',
        slug: 'backend',
        status: TagStatus.ACTIVE,
      },
      {
        id: 'tag-2',
        name: 'JavaScript',
        slug: 'javascript',
        status: TagStatus.ACTIVE,
      },
    ]);
    generator.generate.mockResolvedValue({
      title: ' Better title ',
      description: ' Better description ',
      hashtags: ['NestJS', '#Backend', 'NestJS'],
      suggestedTagSlugs: ['backend', 'missing-tag', 'javascript', 'backend'],
      provider: 'z-ai',
      model: 'glm-4.5-flash',
    });
  });

  it('generates metadata suggestion using category and active tags', async () => {
    const result = await useCase.execute({
      userId: 'owner-1',
      traceId: 'trace-1',
      title: ' Video title ',
      description: ' Current description ',
      categoryId: 'category-1',
      tagIds: ['tag-1'],
      language: 'vi',
      tone: 'natural',
      maxDescriptionLength: 1200,
    });

    expect(generator.generate).toHaveBeenCalledWith({
      title: 'Video title',
      description: 'Current description',
      categoryName: 'Programming',
      categorySlug: 'programming',
      selectedTags: [{ id: 'tag-1', name: 'Backend', slug: 'backend' }],
      allowedTags: [
        { id: 'tag-1', name: 'Backend', slug: 'backend' },
        { id: 'tag-2', name: 'JavaScript', slug: 'javascript' },
      ],
      language: 'vi',
      tone: 'natural',
      maxDescriptionLength: 1200,
      traceId: 'trace-1',
    });
    expect(result).toEqual({
      title: 'Better title',
      description: 'Better description',
      hashtags: ['#NestJS', '#Backend'],
      suggestedTags: [
        { id: 'tag-1', name: 'Backend', slug: 'backend' },
        { id: 'tag-2', name: 'JavaScript', slug: 'javascript' },
      ],
      provider: 'z-ai',
      model: 'glm-4.5-flash',
    });
  });

  it('rejects inactive categories', async () => {
    categoryRepository.findById.mockResolvedValue({
      id: 'category-1',
      name: 'Programming',
      slug: 'programming',
      status: CategoryStatus.INACTIVE,
    });

    await expect(
      useCase.execute({
        userId: 'owner-1',
        title: 'Video title',
        description: '',
        categoryId: 'category-1',
        tagIds: [],
        language: 'en',
        tone: 'seo',
        maxDescriptionLength: 1200,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
