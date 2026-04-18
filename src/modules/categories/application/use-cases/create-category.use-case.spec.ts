import {
  BadRequestException,
  ConflictException,
} from '@shared/domain/exceptions/domain.exception';
import { Category, CategoryStatus } from '../../domain/entities/category.entity';
import { CreateCategoryUseCase } from './create-category.use-case';

describe('CreateCategoryUseCase', () => {
  const categoryRepository = {
    save: jest.fn<Promise<void>, [Category]>(),
    findById: jest.fn(),
    findBySlug: jest.fn<Promise<Category | null>, [string]>(),
    findAll: jest.fn(),
  };

  let useCase: CreateCategoryUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateCategoryUseCase(categoryRepository);
  });

  it('creates a category successfully', async () => {
    categoryRepository.findBySlug.mockResolvedValue(null);
    categoryRepository.save.mockResolvedValue(undefined);

    const result = await useCase.execute({
      name: 'Technology',
      description: 'Latest updates',
    });

    expect(categoryRepository.findBySlug).toHaveBeenCalledWith('technology');
    expect(categoryRepository.save).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      name: 'Technology',
      description: 'Latest updates',
    });
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('trims the name before checking slug and saving', async () => {
    categoryRepository.findBySlug.mockResolvedValue(null);
    categoryRepository.save.mockResolvedValue(undefined);

    const result = await useCase.execute({
      name: '  Science News  ',
      description: '  Curated topics  ',
    });

    expect(categoryRepository.findBySlug).toHaveBeenCalledWith('science-news');
    const savedCategory = categoryRepository.save.mock.calls[0]?.[0];
    expect(savedCategory).toBeInstanceOf(Category);
    expect(savedCategory?.name).toBe('Science News');
    expect(savedCategory?.description).toBe('Curated topics');
    expect(savedCategory?.status).toBe(CategoryStatus.ACTIVE);
    expect(result.name).toBe('Science News');
  });

  it('normalizes an empty description to undefined in the response', async () => {
    categoryRepository.findBySlug.mockResolvedValue(null);
    categoryRepository.save.mockResolvedValue(undefined);

    const result = await useCase.execute({
      name: 'Travel',
      description: '   ',
    });

    const savedCategory = categoryRepository.save.mock.calls[0]?.[0];
    expect(savedCategory?.description).toBeNull();
    expect(result.description).toBeUndefined();
  });

  it('throws conflict when a category with the same slug exists', async () => {
    categoryRepository.findBySlug.mockResolvedValue(
      Category.create({
        name: 'Existing Category',
        description: null,
        status: CategoryStatus.ACTIVE,
      }),
    );

    await expect(
      useCase.execute({
        name: ' existing category ',
        description: 'duplicate',
      }),
    ).rejects.toThrow(ConflictException);

    expect(categoryRepository.save).not.toHaveBeenCalled();
  });

  it('propagates bad request when the name is invalid', async () => {
    categoryRepository.findBySlug.mockResolvedValue(null);

    await expect(
      useCase.execute({
        name: '   ',
        description: 'invalid',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(categoryRepository.save).not.toHaveBeenCalled();
  });
});
