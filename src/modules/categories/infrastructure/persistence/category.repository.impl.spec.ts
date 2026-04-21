import { Category, CategoryStatus } from '../../domain/entities/category.entity';
import {
  CATEGORY_CACHE_KEYS,
  CATEGORY_CACHE_TTL_SECONDS,
} from '../cache.constants';
import { CategoryRepositoryImpl } from './category.repository.impl';
import type { CategoryOrmEntity } from './category.orm-entity';

describe('CategoryRepositoryImpl', () => {
  const ormRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
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
    jest.resetAllMocks();
  });

  it('returns active categories from cache without querying database', async () => {
    cacheService.get.mockResolvedValue([buildCachedCategory()]);

    const result = await repository.findActive();

    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(Category);
    expect(result[0].id).toBe('category-1');
    expect(result[0].createdAt).toEqual(
      new Date('2026-01-01T00:00:00.000Z'),
    );
    expect(ormRepository.find).not.toHaveBeenCalled();
    expect(cacheService.set).not.toHaveBeenCalled();
  });

  it('queries database and caches active categories on cache miss', async () => {
    const row = buildOrmCategory();
    cacheService.get.mockResolvedValue(null);
    ormRepository.find.mockResolvedValue([row]);

    const result = await repository.findActive();

    expect(result).toHaveLength(1);
    expect(ormRepository.find).toHaveBeenCalledWith({
      where: { status: CategoryStatus.ACTIVE },
      order: { name: 'ASC', createdAt: 'ASC' },
    });
    expect(cacheService.set).toHaveBeenCalledWith(
      CATEGORY_CACHE_KEYS.activeList,
      [
        {
          id: 'category-1',
          name: 'Music',
          slug: 'music',
          description: null,
          status: CategoryStatus.ACTIVE,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      CATEGORY_CACHE_TTL_SECONDS.activeList,
    );
  });

  it('falls back to database when cache get fails', async () => {
    cacheService.get.mockRejectedValue(new Error('redis unavailable'));
    ormRepository.find.mockResolvedValue([buildOrmCategory()]);

    const result = await repository.findActive();

    expect(result).toHaveLength(1);
    expect(ormRepository.find).toHaveBeenCalled();
  });

  it('returns database result when cache set fails', async () => {
    cacheService.get.mockResolvedValue(null);
    cacheService.set.mockRejectedValue(new Error('redis unavailable'));
    ormRepository.find.mockResolvedValue([buildOrmCategory()]);

    await expect(repository.findActive()).resolves.toHaveLength(1);
  });

  it('invalidates active categories cache after save succeeds', async () => {
    const category = buildDomainCategory();
    ormRepository.save.mockResolvedValue(undefined);

    await repository.save(category);

    expect(ormRepository.save).toHaveBeenCalledWith({
      id: 'category-1',
      name: 'Music',
      slug: 'music',
      description: null,
      status: CategoryStatus.ACTIVE,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    expect(cacheService.del).toHaveBeenCalledWith(
      CATEGORY_CACHE_KEYS.activeList,
    );
  });

  it('does not invalidate active categories cache when save fails', async () => {
    ormRepository.save.mockRejectedValue(new Error('db unavailable'));

    await expect(repository.save(buildDomainCategory())).rejects.toThrow(
      'db unavailable',
    );
    expect(cacheService.del).not.toHaveBeenCalled();
  });

  it('does not fail save when cache invalidation fails', async () => {
    ormRepository.save.mockResolvedValue(undefined);
    cacheService.del.mockRejectedValue(new Error('redis unavailable'));

    await expect(repository.save(buildDomainCategory())).resolves.toBeUndefined();
  });
});

function buildCachedCategory(): {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: CategoryStatus;
  createdAt: string;
  updatedAt: string;
} {
  return {
    id: 'category-1',
    name: 'Music',
    slug: 'music',
    description: null,
    status: CategoryStatus.ACTIVE,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  };
}

function buildOrmCategory(): CategoryOrmEntity {
  return {
    id: 'category-1',
    name: 'Music',
    slug: 'music',
    description: null,
    status: CategoryStatus.ACTIVE,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };
}

function buildDomainCategory(): Category {
  return new Category({
    id: 'category-1',
    name: 'Music',
    slug: 'music',
    description: null,
    status: CategoryStatus.ACTIVE,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  });
}
