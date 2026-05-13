import { CategoryStatus } from '../../domain/entities/category.entity';
import { CategoryRepositoryImpl } from './category.repository.impl';
import type { CategoryOrmEntity } from './category.orm-entity';

describe('CategoryRepositoryImpl', () => {
  const queryBuilder = {
    where: jest.fn(),
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    getMany: jest.fn(),
  };
  const ormRepository = {
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
  };
  const cacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };
  const repository = new CategoryRepositoryImpl(
    ormRepository as never,
    cacheService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    queryBuilder.where.mockReturnValue(queryBuilder);
    queryBuilder.andWhere.mockReturnValue(queryBuilder);
    queryBuilder.orderBy.mockReturnValue(queryBuilder);
    queryBuilder.addOrderBy.mockReturnValue(queryBuilder);
    ormRepository.createQueryBuilder.mockReturnValue(queryBuilder);
  });

  it('searches active categories by name or slug', async () => {
    queryBuilder.getMany.mockResolvedValue([buildCategoryRow()]);

    const result = await repository.searchActive(' Mus ');

    expect(ormRepository.createQueryBuilder).toHaveBeenCalledWith('category');
    expect(queryBuilder.where).toHaveBeenCalledWith(
      expect.stringContaining('LOWER(category.name) LIKE :partial'),
      { partial: '%mus%' },
    );
    expect(queryBuilder.where).toHaveBeenCalledWith(
      expect.stringContaining('LOWER(category.slug) LIKE :partial'),
      { partial: '%mus%' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'category.status = :status',
      { status: CategoryStatus.ACTIVE },
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('category.name', 'ASC');
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
      'category.createdAt',
      'ASC',
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.status).toBe(CategoryStatus.ACTIVE);
  });

  it('searches all categories by name or slug without status filter', async () => {
    queryBuilder.getMany.mockResolvedValue([
      buildCategoryRow({ status: CategoryStatus.INACTIVE }),
    ]);

    const result = await repository.searchAll(' mov ');

    expect(ormRepository.createQueryBuilder).toHaveBeenCalledWith('category');
    expect(queryBuilder.where).toHaveBeenCalledWith(
      expect.stringContaining('LOWER(category.name) LIKE :partial'),
      { partial: '%mov%' },
    );
    expect(queryBuilder.where).toHaveBeenCalledWith(
      expect.stringContaining('LOWER(category.slug) LIKE :partial'),
      { partial: '%mov%' },
    );
    expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0]?.status).toBe(CategoryStatus.INACTIVE);
  });

  it('returns an empty list when search has no matches', async () => {
    queryBuilder.getMany.mockResolvedValue([]);

    await expect(repository.searchActive('missing')).resolves.toEqual([]);
  });

  it('falls back to active categories when keyword is blank', async () => {
    cacheService.get.mockResolvedValue(null);
    ormRepository.find.mockResolvedValue([buildCategoryRow()]);

    const result = await repository.searchActive('   ');

    expect(ormRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(ormRepository.find).toHaveBeenCalledWith({
      where: { status: CategoryStatus.ACTIVE },
      order: { name: 'ASC', createdAt: 'ASC' },
    });
    expect(result).toHaveLength(1);
  });

  it('falls back to all categories when admin keyword is blank', async () => {
    ormRepository.find.mockResolvedValue([
      buildCategoryRow({ status: CategoryStatus.INACTIVE }),
    ]);

    const result = await repository.searchAll('   ');

    expect(ormRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(ormRepository.find).toHaveBeenCalledWith({
      order: { name: 'ASC', createdAt: 'ASC' },
    });
    expect(result).toHaveLength(1);
  });
});

function buildCategoryRow(
  overrides: Partial<{ status: CategoryStatus }> = {},
): CategoryOrmEntity {
  return {
    id: 'category-1',
    name: 'Music',
    slug: 'music',
    description: null,
    status: overrides.status ?? CategoryStatus.ACTIVE,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}
