import { ForbiddenException } from '@shared/domain/exceptions/domain.exception';
import { CategoryStatus } from '../../domain/entities/category.entity';
import { CategoryController } from './category.controller';

describe('CategoryController', () => {
  const createCategoryUseCase = {
    execute: jest.fn(),
  };
  const getAllCategoriesUseCase = {
    execute: jest.fn(),
  };
  const getCategoriesUseCase = {
    execute: jest.fn(),
  };
  const updateCategoryUseCase = {
    execute: jest.fn(),
  };
  const controller = new CategoryController(
    createCategoryUseCase as never,
    getAllCategoriesUseCase as never,
    getCategoriesUseCase as never,
    updateCategoryUseCase as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects create category when role is not admin', async () => {
    await expect(
      controller.createCategory('user-1', 'creator', { name: 'Music' }),
    ).rejects.toThrow(ForbiddenException);
    expect(createCategoryUseCase.execute).not.toHaveBeenCalled();
  });

  it('returns public categories using active-only use case', async () => {
    const category = buildCategoryResponse();
    getCategoriesUseCase.execute.mockResolvedValue([category]);

    const result = await controller.getCategories();

    expect(getCategoriesUseCase.execute).toHaveBeenCalledWith({
      q: undefined,
    });
    expect(getAllCategoriesUseCase.execute).not.toHaveBeenCalled();
    expect(result).toEqual([
      {
        ...category,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
  });

  it('searches public categories using query keyword', async () => {
    const category = buildCategoryResponse();
    getCategoriesUseCase.execute.mockResolvedValue([category]);

    const result = await controller.getCategories('music');

    expect(getCategoriesUseCase.execute).toHaveBeenCalledWith({
      q: 'music',
    });
    expect(result).toEqual([
      {
        ...category,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
  });

  it('rejects admin all categories when role is not admin', async () => {
    await expect(
      controller.getAllCategoriesForAdmin('user-1', 'creator'),
    ).rejects.toThrow(ForbiddenException);
    expect(getAllCategoriesUseCase.execute).not.toHaveBeenCalled();
  });

  it('rejects admin all categories when role is missing', async () => {
    await expect(
      controller.getAllCategoriesForAdmin('user-1', undefined),
    ).rejects.toThrow(ForbiddenException);
    expect(getAllCategoriesUseCase.execute).not.toHaveBeenCalled();
  });

  it('returns all categories for admin', async () => {
    const category = buildCategoryResponse(CategoryStatus.DELETED);
    getAllCategoriesUseCase.execute.mockResolvedValue([category]);

    const result = await controller.getAllCategoriesForAdmin(
      'user-1',
      'admin',
    );

    expect(getAllCategoriesUseCase.execute).toHaveBeenCalledWith({
      q: undefined,
    });
    expect(result).toEqual([
      {
        ...category,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
  });

  it('searches all categories for admin using query keyword', async () => {
    const category = buildCategoryResponse(CategoryStatus.INACTIVE);
    getAllCategoriesUseCase.execute.mockResolvedValue([category]);

    const result = await controller.getAllCategoriesForAdmin(
      'user-1',
      'admin',
      'movie',
    );

    expect(getAllCategoriesUseCase.execute).toHaveBeenCalledWith({
      q: 'movie',
    });
    expect(result).toEqual([
      {
        ...category,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
  });

  it('creates category when role is admin', async () => {
    const category = buildCategoryResponse();
    createCategoryUseCase.execute.mockResolvedValue(category);

    const result = await controller.createCategory('user-1', 'admin', {
      name: 'Music',
    });

    expect(createCategoryUseCase.execute).toHaveBeenCalledWith({
      name: 'Music',
      description: undefined,
    });
    expect(result).toEqual({
      ...category,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('rejects update category when role is not admin', async () => {
    await expect(
      controller.updateCategory('user-1', undefined, 'category-1', {
        name: 'Music',
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(updateCategoryUseCase.execute).not.toHaveBeenCalled();
  });

  it('updates category when role is admin', async () => {
    const category = buildCategoryResponse();
    updateCategoryUseCase.execute.mockResolvedValue(category);

    const result = await controller.updateCategory(
      'user-1',
      'admin',
      'category-1',
      {
        description: 'Updated',
      },
    );

    expect(updateCategoryUseCase.execute).toHaveBeenCalledWith({
      categoryId: 'category-1',
      name: undefined,
      description: 'Updated',
    });
    expect(result).toEqual({
      ...category,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
  });
});

function buildCategoryResponse(status = CategoryStatus.ACTIVE): {
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
    status,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}
