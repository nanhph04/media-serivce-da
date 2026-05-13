import { ConflictException } from '@shared/domain/exceptions/domain.exception';
import {
  Category,
  CategoryStatus,
} from '../../domain/entities/category.entity';
import type { ICategoryRepository } from '../../domain/repositories/category.repository';
import { CreateCategoryUseCase } from './create-category.use-case';

describe('CreateCategoryUseCase', () => {
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
  const useCase = new CreateCategoryUseCase(categoryRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates category when slug does not exist', async () => {
    categoryRepository.findBySlug.mockResolvedValue(null);

    const result = await useCase.execute({
      name: ' Music ',
      description: ' Songs ',
    });

    expect(result).toEqual({
      id: expect.any(String),
      name: 'Music',
      slug: 'music',
      description: 'Songs',
      status: CategoryStatus.ACTIVE,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
    expect(categoryRepository.save).toHaveBeenCalledWith(expect.any(Category));
  });

  it('throws conflict when slug already exists', async () => {
    categoryRepository.findBySlug.mockResolvedValue(buildCategory());

    await expect(
      useCase.execute({
        name: 'Music',
      }),
    ).rejects.toThrow(ConflictException);
    expect(categoryRepository.save).not.toHaveBeenCalled();
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
