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
    findActive: jest.fn(),
    searchAll: jest.fn(),
    searchActive: jest.fn(),
    findBySlugs: jest.fn(),
  };
  const useCase = new GetAllCategoriesUseCase(categoryRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns all categories from repository', async () => {
    categoryRepository.findAll.mockResolvedValue([
      buildCategory('category-1', 'Music', CategoryStatus.ACTIVE),
      buildCategory('category-2', 'Movies', CategoryStatus.INACTIVE),
      buildCategory('category-3', 'Deleted', CategoryStatus.DELETED),
    ]);

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
      {
        id: 'category-2',
        name: 'Movies',
        slug: 'movies',
        description: undefined,
        status: CategoryStatus.INACTIVE,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        id: 'category-3',
        name: 'Deleted',
        slug: 'deleted',
        description: undefined,
        status: CategoryStatus.DELETED,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);
    expect(categoryRepository.findAll).toHaveBeenCalled();
    expect(categoryRepository.searchAll).not.toHaveBeenCalled();
    expect(categoryRepository.findActive).not.toHaveBeenCalled();
  });

  it('searches all categories when query is provided', async () => {
    categoryRepository.searchAll.mockResolvedValue([
      buildCategory('category-2', 'Movies', CategoryStatus.INACTIVE),
    ]);

    await expect(useCase.execute({ q: ' movie ' })).resolves.toEqual([
      {
        id: 'category-2',
        name: 'Movies',
        slug: 'movies',
        description: undefined,
        status: CategoryStatus.INACTIVE,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);
    expect(categoryRepository.searchAll).toHaveBeenCalledWith('movie');
    expect(categoryRepository.findAll).not.toHaveBeenCalled();
  });

  it('falls back to all categories when query is blank', async () => {
    categoryRepository.findAll.mockResolvedValue([
      buildCategory('category-1', 'Music', CategoryStatus.ACTIVE),
    ]);

    await useCase.execute({ q: '   ' });

    expect(categoryRepository.findAll).toHaveBeenCalled();
    expect(categoryRepository.searchAll).not.toHaveBeenCalled();
  });
});

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
