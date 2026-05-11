import { BadRequestException } from '@shared/domain/exceptions/domain.exception';
import {
  Category,
  CategoryStatus,
} from '../../../categories/domain/entities/category.entity';
import {
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { InitVideoUploadUseCase } from './init-video-upload.use-case';

describe('InitVideoUploadUseCase', () => {
  const videoRepository = {
    save: jest.fn(),
  };
  const categoryRepository = {
    findBySlugs: jest.fn(),
  };
  const channelAccessService = {
    getOwnedActiveChannelId: jest.fn(),
  };
  const objectStorageService = {
    getBucketName: jest.fn(),
    createUploadUrl: jest.fn(),
  };

  const useCase = new InitVideoUploadUseCase(
    videoRepository as never,
    categoryRepository as never,
    channelAccessService as never,
    objectStorageService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    channelAccessService.getOwnedActiveChannelId.mockResolvedValue('channel-1');
    objectStorageService.getBucketName.mockReturnValue('raw-videos');
    objectStorageService.createUploadUrl.mockResolvedValue(
      'https://upload.example.com',
    );
  });

  it('succeeds with one valid category', async () => {
    categoryRepository.findBySlugs.mockResolvedValue([buildCategory()]);

    const result = await useCase.execute(
      buildCommand({ categories: ['music'] }),
    );

    expect(categoryRepository.findBySlugs).toHaveBeenCalledWith(['music']);
    expect(videoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: VideoStatus.DRAFT,
      }),
    );
    expect(result.bucket).toBe('raw-videos');
  });

  it('succeeds with multiple valid categories', async () => {
    categoryRepository.findBySlugs.mockResolvedValue([
      buildCategory(),
      buildCategory({
        id: 'category-2',
        name: 'News',
        slug: 'news',
      }),
    ]);

    await useCase.execute(buildCommand({ categories: ['music', 'news'] }));

    expect(categoryRepository.findBySlugs).toHaveBeenCalledWith([
      'music',
      'news',
    ]);
  });

  it('de-duplicates repeated category slugs before lookup', async () => {
    categoryRepository.findBySlugs.mockResolvedValue([buildCategory()]);

    await useCase.execute(
      buildCommand({ categories: ['music', ' music ', 'music'] }),
    );

    expect(categoryRepository.findBySlugs).toHaveBeenCalledWith(['music']);
  });

  it('rejects when normalized categories are empty', async () => {
    await expect(
      useCase.execute(buildCommand({ categories: [' ', '   '] })),
    ).rejects.toThrow(
      new BadRequestException('At least one category is required'),
    );
    expect(categoryRepository.findBySlugs).not.toHaveBeenCalled();
  });

  it('rejects when one or more categories do not exist', async () => {
    categoryRepository.findBySlugs.mockResolvedValue([buildCategory()]);

    await expect(
      useCase.execute(buildCommand({ categories: ['music', 'missing'] })),
    ).rejects.toThrow(
      new BadRequestException('One or more categories are invalid'),
    );
  });

  it('rejects when all provided categories are invalid', async () => {
    categoryRepository.findBySlugs.mockResolvedValue([]);

    await expect(
      useCase.execute(buildCommand({ categories: ['missing'] })),
    ).rejects.toThrow(
      new BadRequestException('One or more categories are invalid'),
    );
  });

  it('rejects inactive categories', async () => {
    categoryRepository.findBySlugs.mockResolvedValue([
      buildCategory({ status: CategoryStatus.INACTIVE }),
    ]);

    await expect(
      useCase.execute(buildCommand({ categories: ['music'] })),
    ).rejects.toThrow(
      new BadRequestException('One or more categories are invalid'),
    );
  });

  it('no longer falls back to the default category', async () => {
    categoryRepository.findBySlugs.mockResolvedValue([]);

    await expect(
      useCase.execute(buildCommand({ categories: ['unknown'] })),
    ).rejects.toThrow(BadRequestException);
    expect(videoRepository.save).not.toHaveBeenCalled();
  });
});

function buildCommand(
  overrides: Partial<{
    categories: string[];
  }> = {},
): {
  userId: string;
  title: string;
  description: string;
  categories: string[];
  visibility: VideoVisibility;
  price: number;
  requiredTierLevel: number | null;
} {
  return {
    userId: 'owner-1',
    title: 'Video title',
    description: 'Description',
    categories: overrides.categories ?? ['music'],
    visibility: VideoVisibility.PUBLIC,
    price: 0,
    requiredTierLevel: null,
  };
}

function buildCategory(
  overrides: Partial<{
    id: string;
    name: string;
    slug: string;
    status: CategoryStatus;
  }> = {},
): Category {
  return new Category({
    id: overrides.id ?? 'category-1',
    name: overrides.name ?? 'Music',
    slug: overrides.slug ?? 'music',
    description: null,
    status: overrides.status ?? CategoryStatus.ACTIVE,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  });
}
