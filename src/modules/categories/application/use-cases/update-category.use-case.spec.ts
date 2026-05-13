import {
  ConflictException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  Category,
  CategoryStatus,
} from '../../domain/entities/category.entity';
import type { ICategoryRepository } from '../../domain/repositories/category.repository';
import { UpdateCategoryUseCase } from './update-category.use-case';

describe('UpdateCategoryUseCase', () => {
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
  const useCase = new UpdateCategoryUseCase(categoryRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates name and slug', async () => {
    const category = buildCategory();
    categoryRepository.findById.mockResolvedValue(category);
    categoryRepository.findBySlug.mockResolvedValue(null);

    const result = await useCase.execute({
      categoryId: 'category-1',
      name: 'New Music',
    });

    expect(result.name).toBe('New Music');
    expect(result.slug).toBe('new-music');
    expect(categoryRepository.save).toHaveBeenCalledWith(category);
  });

  it('updates description', async () => {
    const category = buildCategory();
    categoryRepository.findById.mockResolvedValue(category);

    const result = await useCase.execute({
      categoryId: 'category-1',
      description: ' Updated description ',
    });

    expect(result.description).toBe('Updated description');
    expect(categoryRepository.findBySlug).not.toHaveBeenCalled();
    expect(categoryRepository.save).toHaveBeenCalledWith(category);
  });

  it('throws not found when category does not exist', async () => {
    categoryRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        categoryId: 'missing-category',
        name: 'Music',
      }),
    ).rejects.toThrow(NotFoundException);
    expect(categoryRepository.save).not.toHaveBeenCalled();
  });

  it('throws conflict when new slug belongs to another category', async () => {
    categoryRepository.findById.mockResolvedValue(buildCategory());
    categoryRepository.findBySlug.mockResolvedValue(
      buildCategory({ id: 'category-2' }),
    );

    await expect(
      useCase.execute({
        categoryId: 'category-1',
        name: 'Movies',
      }),
    ).rejects.toThrow(ConflictException);
    expect(categoryRepository.save).not.toHaveBeenCalled();
  });

  it('allows unchanged slug owned by same category', async () => {
    const category = buildCategory();
    categoryRepository.findById.mockResolvedValue(category);
    categoryRepository.findBySlug.mockResolvedValue(category);

    const result = await useCase.execute({
      categoryId: 'category-1',
      name: 'Music',
    });

    expect(result.slug).toBe('music');
    expect(categoryRepository.save).toHaveBeenCalledWith(category);
  });
});

function buildCategory(overrides: Partial<{ id: string }> = {}): Category {
  return new Category({
    id: overrides.id ?? 'category-1',
    name: 'Music',
    slug: 'music',
    description: null,
    status: CategoryStatus.ACTIVE,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}
