import { CategoryController } from './category.controller';

describe('CategoryController', () => {
  const getCategoriesUseCase = {
    execute: jest.fn(),
  };
  const controller = new CategoryController(getCategoriesUseCase as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns public categories using active-only use case', async () => {
    const category = buildCategoryResponse();
    getCategoriesUseCase.execute.mockResolvedValue({
      items: [category],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    const result = await controller.getCategories();

    expect(getCategoriesUseCase.execute).toHaveBeenCalledWith({
      q: undefined,
      page: 1,
      limit: 20,
    });
    expect(result).toMatchObject({
      data: [
        {
          ...category,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
  });

  it('searches public categories using query keyword', async () => {
    const category = buildCategoryResponse();
    getCategoriesUseCase.execute.mockResolvedValue({
      items: [category],
      pagination: { page: 2, limit: 10, total: 1, totalPages: 1 },
    });

    const result = await controller.getCategories('music', '2', '10');

    expect(getCategoriesUseCase.execute).toHaveBeenCalledWith({
      q: 'music',
      page: 2,
      limit: 10,
    });
    expect(result).toMatchObject({
      data: [
        {
          ...category,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      pagination: { page: 2, limit: 10, total: 1, totalPages: 1 },
    });
  });
});

function buildCategoryResponse(): {
  id: string;
  name: string;
  slug: string;
  description: undefined;
  parentId: string | null;
  status: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: 'category-1',
    name: 'Music',
    slug: 'music',
    description: undefined,
    parentId: null,
    status: 'active',
    displayOrder: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}
