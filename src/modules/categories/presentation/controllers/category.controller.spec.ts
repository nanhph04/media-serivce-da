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
    getCategoriesUseCase.execute.mockResolvedValue([category]);

    const result = await controller.getCategories();

    expect(getCategoriesUseCase.execute).toHaveBeenCalledWith({
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
