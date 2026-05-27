import {
  Category,
  CategoryStatus,
} from '../../../categories/domain/entities/category.entity';
import type { ICategoryRepository } from '../../../categories/domain/repositories/category.repository';
import {
  BadRequestException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import type { IVideoQueryService } from '../interfaces/video-query.service.interface';
import { GetVideosByCategoryUseCase } from './get-videos-by-category.use-case';

describe('GetVideosByCategoryUseCase', () => {
  const videoQueryService: jest.Mocked<IVideoQueryService> = {
    getPublicVideoSummariesByChannel: jest.fn(),
    getChannelMembershipEligibilityMetrics: jest.fn(),
    getVideoMetadata: jest.fn(),
    getLatestVideos: jest.fn(),
    getStudioVideos: jest.fn(),
    getVideosByCategory: jest.fn(),
    searchPublicVideos: jest.fn(),
    getContinueWatching: jest.fn(),
  };
  const categoryRepository: jest.Mocked<ICategoryRepository> = {
    save: jest.fn(),
    findById: jest.fn(),
    findBySlug: jest.fn(),
    findAll: jest.fn(),
    findActive: jest.fn(),
    searchAll: jest.fn(),
    searchActive: jest.fn(),
    findBySlugs: jest.fn(),
  };
  const useCase = new GetVideosByCategoryUseCase(
    videoQueryService,
    categoryRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns paged videos for an active category', async () => {
    categoryRepository.findBySlug.mockResolvedValue(buildCategory());
    videoQueryService.getVideosByCategory.mockResolvedValue({
      items: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    });

    await useCase.execute({
      category: ' music ',
      page: 1,
      limit: 20,
    });

    expect(categoryRepository.findBySlug).toHaveBeenCalledWith('music');
    expect(videoQueryService.getVideosByCategory).toHaveBeenCalledWith(
      'music',
      1,
      20,
    );
  });

  it('rejects blank category', async () => {
    await expect(
      useCase.execute({
        category: '   ',
        page: 1,
        limit: 20,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(categoryRepository.findBySlug).not.toHaveBeenCalled();
  });

  it('rejects missing category', async () => {
    await expect(
      useCase.execute({
        page: 1,
        limit: 20,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(categoryRepository.findBySlug).not.toHaveBeenCalled();
  });

  it('throws not found when category does not exist', async () => {
    categoryRepository.findBySlug.mockResolvedValue(null);

    await expect(
      useCase.execute({
        category: 'missing',
        page: 1,
        limit: 20,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws not found when category is inactive', async () => {
    categoryRepository.findBySlug.mockResolvedValue(
      buildCategory({ status: CategoryStatus.INACTIVE }),
    );

    await expect(
      useCase.execute({
        category: 'music',
        page: 1,
        limit: 20,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});

function buildCategory(
  overrides: Partial<{ status: CategoryStatus }> = {},
): Category {
  return new Category({
    id: 'category-1',
    name: 'Music',
    slug: 'music',
    description: null,
    status: overrides.status ?? CategoryStatus.ACTIVE,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  });
}
