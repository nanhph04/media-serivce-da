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
    findActive: jest.fn(),
    searchAll: jest.fn(),
    searchActive: jest.fn(),
    findBySlugs: jest.fn(),
  };
  const useCase = new GetCategoriesUseCase(categoryRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns active categories from repository', async () => {
    categoryRepository.findActive.mockResolvedValue([buildCategory()]);

    await expect(useCase.execute()).resolves.toEqual([
      {
        id: 'category-1',
        name: 'Music',
        slug: 'music',
        description: undefined,
        status: CategoryStatus.ACTIVE,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);
    expect(categoryRepository.findActive).toHaveBeenCalled();
    expect(categoryRepository.searchActive).not.toHaveBeenCalled();
    expect(categoryRepository.findAll).not.toHaveBeenCalled();
  });

  it('searches active categories when query is provided', async () => {
    categoryRepository.searchActive.mockResolvedValue([buildCategory()]);

    await expect(useCase.execute({ q: ' music ' })).resolves.toEqual([
      {
        id: 'category-1',
        name: 'Music',
        slug: 'music',
        description: undefined,
        status: CategoryStatus.ACTIVE,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);
    expect(categoryRepository.searchActive).toHaveBeenCalledWith('music');
    expect(categoryRepository.findActive).not.toHaveBeenCalled();
  });

  it('falls back to active list when query is blank', async () => {
    categoryRepository.findActive.mockResolvedValue([buildCategory()]);

    await useCase.execute({ q: '   ' });

    expect(categoryRepository.findActive).toHaveBeenCalled();
    expect(categoryRepository.searchActive).not.toHaveBeenCalled();
  });
});

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
