import {
  Category,
  CategoryStatus,
} from '../../domain/entities/category.entity';
import type { ICategoryRepository } from '../../domain/repositories/category.repository';
import { GetAllCategoriesUseCase } from './get-all-categories.use-case';

describe('GetAllCategoriesUseCase', () => {
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
  const useCase = new GetAllCategoriesUseCase(categoryRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns all categories from repository', async () => {
    categoryRepository.findAllPaged.mockResolvedValue({
      items: [
        buildCategory('category-1', 'Music', CategoryStatus.ACTIVE),
        buildCategory('category-2', 'Movies', CategoryStatus.INACTIVE),
        buildCategory('category-3', 'Deleted', CategoryStatus.DELETED),
      ],
      total: 3,
    });

    await expect(useCase.execute()).resolves.toEqual({
      items: [
        buildCategoryResponse('category-1', 'Music', CategoryStatus.ACTIVE),
        buildCategoryResponse('category-2', 'Movies', CategoryStatus.INACTIVE),
        buildCategoryResponse('category-3', 'Deleted', CategoryStatus.DELETED),
      ],
      pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
    });
    expect(categoryRepository.findAllPaged).toHaveBeenCalledWith(1, 20);
    expect(categoryRepository.searchAllPaged).not.toHaveBeenCalled();
    expect(categoryRepository.findActive).not.toHaveBeenCalled();
  });

  it('searches all categories when query is provided', async () => {
    categoryRepository.searchAllPaged.mockResolvedValue({
      items: [buildCategory('category-2', 'Movies', CategoryStatus.INACTIVE)],
      total: 1,
    });

    await expect(
      useCase.execute({ q: ' movie ', page: 2, limit: 10 }),
    ).resolves.toEqual({
      items: [
        buildCategoryResponse('category-2', 'Movies', CategoryStatus.INACTIVE),
      ],
      pagination: { page: 2, limit: 10, total: 1, totalPages: 1 },
    });
    expect(categoryRepository.searchAllPaged).toHaveBeenCalledWith(
      'movie',
      2,
      10,
    );
    expect(categoryRepository.findAllPaged).not.toHaveBeenCalled();
  });

  it('falls back to all categories when query is blank', async () => {
    categoryRepository.findAllPaged.mockResolvedValue({
      items: [buildCategory('category-1', 'Music', CategoryStatus.ACTIVE)],
      total: 1,
    });

    await useCase.execute({ q: '   ', page: 1, limit: 20 });

    expect(categoryRepository.findAllPaged).toHaveBeenCalledWith(1, 20);
    expect(categoryRepository.searchAllPaged).not.toHaveBeenCalled();
  });
});

function buildCategoryResponse(
  id: string,
  name: string,
  status: CategoryStatus,
): {
  id: string;
  name: string;
  slug: string;
  description: undefined;
  status: CategoryStatus;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id,
    name,
    slug: Category.convertNameToSlug(name),
    description: undefined,
    status,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

function buildCategory(
  id: string,
  name: string,
  status: CategoryStatus,
): Category {
  return new Category({
    id,
    name,
    slug: Category.convertNameToSlug(name),
    description: null,
    status,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}
