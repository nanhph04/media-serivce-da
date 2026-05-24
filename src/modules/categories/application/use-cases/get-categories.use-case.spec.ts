import {
  Category,
  CategoryStatus,
} from '../../domain/entities/category.entity';
import type { ICategoryRepository } from '../../domain/repositories/category.repository';
import { GetCategoriesUseCase } from './get-categories.use-case';

describe('GetCategoriesUseCase', () => {
  const categoryRepository: jest.Mocked<ICategoryRepository> = {
    save: jest.fn(),
    findById: jest.fn(),
    findBySlug: jest.fn(),
    findAll: jest.fn(),
    findAllPaged: jest.fn(),
    findActive: jest.fn(),
    findActivePaged: jest.fn(),
    searchAll: jest.fn(),
    searchAllPaged: jest.fn(),
    searchActive: jest.fn(),
    searchActivePaged: jest.fn(),
    findBySlugs: jest.fn(),
  };
  const useCase = new GetCategoriesUseCase(categoryRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns active categories from repository', async () => {
    categoryRepository.findActivePaged.mockResolvedValue({
      items: [buildCategory()],
      total: 1,
    });

    await expect(useCase.execute()).resolves.toEqual({
      items: [buildCategoryResponse()],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    expect(categoryRepository.findActivePaged).toHaveBeenCalledWith(1, 20);
    expect(categoryRepository.searchActivePaged).not.toHaveBeenCalled();
    expect(categoryRepository.findAll).not.toHaveBeenCalled();
  });

  it('searches active categories when query is provided', async () => {
    categoryRepository.searchActivePaged.mockResolvedValue({
      items: [buildCategory()],
      total: 1,
    });

    await expect(
      useCase.execute({ q: ' music ', page: 2, limit: 10 }),
    ).resolves.toEqual({
      items: [buildCategoryResponse()],
      pagination: { page: 2, limit: 10, total: 1, totalPages: 1 },
    });
    expect(categoryRepository.searchActivePaged).toHaveBeenCalledWith(
      'music',
      2,
      10,
    );
    expect(categoryRepository.findActivePaged).not.toHaveBeenCalled();
  });

  it('falls back to active list when query is blank', async () => {
    categoryRepository.findActivePaged.mockResolvedValue({
      items: [buildCategory()],
      total: 1,
    });

    await useCase.execute({ q: '   ', page: 1, limit: 20 });

    expect(categoryRepository.findActivePaged).toHaveBeenCalledWith(1, 20);
    expect(categoryRepository.searchActivePaged).not.toHaveBeenCalled();
  });
});

function buildCategoryResponse(): {
  id: string;
  name: string;
  slug: string;
  description: undefined;
  status: CategoryStatus;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: 'category-1',
    name: 'Music',
    slug: 'music',
    description: undefined,
    status: CategoryStatus.ACTIVE,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

function buildCategory(): Category {
  return new Category({
    id: 'category-1',
    name: 'Music',
    slug: 'music',
    description: null,
    status: CategoryStatus.ACTIVE,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}
