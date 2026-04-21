import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CacheService } from '@shared/infrastructure/cache/cache.service';
import { In, Repository } from 'typeorm';
import { Category, CategoryStatus } from '../../domain/entities/category.entity';
import type { ICategoryRepository } from '../../domain/repositories/category.repository';
import {
  CATEGORY_CACHE_KEYS,
  CATEGORY_CACHE_TTL_SECONDS,
} from '../cache.constants';
import { CategoryOrmEntity } from './category.orm-entity';

type CachedCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: CategoryStatus;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class CategoryRepositoryImpl implements ICategoryRepository {
  constructor(
    @InjectRepository(CategoryOrmEntity)
    private readonly ormRepository: Repository<CategoryOrmEntity>,
    private readonly cacheService: CacheService,
  ) {}

  async save(category: Category): Promise<void> {
    await this.ormRepository.save(this.toOrm(category));
    await this.invalidateActiveCategoriesCache();
  }

  async findById(id: string): Promise<Category | null> {
    const row = await this.ormRepository.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const row = await this.ormRepository.findOne({ where: { slug } });
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<Category[]> {
    const rows = await this.ormRepository.find({
      order: { name: 'ASC', createdAt: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findActive(): Promise<Category[]> {
    const cachedRows = await this.getActiveCategoriesFromCache();

    if (cachedRows) {
      return cachedRows.map((row) => this.cachedToDomain(row));
    }

    const rows = await this.ormRepository.find({
      where: { status: CategoryStatus.ACTIVE },
      order: { name: 'ASC', createdAt: 'ASC' },
    });

    await this.setActiveCategoriesCache(rows);

    return rows.map((row) => this.toDomain(row));
  }

  async findBySlugs(slugs: string[]): Promise<Category[]> {
    if (slugs.length === 0) {
      return [];
    }

    const rows = await this.ormRepository.find({
      where: { slug: In(slugs) },
    });

    return rows.map((row) => this.toDomain(row));
  }

  private toOrm(category: Category): CategoryOrmEntity {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      status: category.status,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  private toDomain(row: CategoryOrmEntity): Category {
    return new Category({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private cachedToDomain(row: CachedCategory): Category {
    return new Category({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      status: row.status,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  private toCached(row: CategoryOrmEntity): CachedCategory {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async getActiveCategoriesFromCache(): Promise<
    CachedCategory[] | null
  > {
    try {
      return await this.cacheService.get<CachedCategory[]>(
        CATEGORY_CACHE_KEYS.activeList,
      );
    } catch {
      return null;
    }
  }

  private async setActiveCategoriesCache(
    rows: CategoryOrmEntity[],
  ): Promise<void> {
    try {
      await this.cacheService.set(
        CATEGORY_CACHE_KEYS.activeList,
        rows.map((row) => this.toCached(row)),
        CATEGORY_CACHE_TTL_SECONDS.activeList,
      );
    } catch {
      // Cache write failure must not fail category reads.
    }
  }

  private async invalidateActiveCategoriesCache(): Promise<void> {
    try {
      await this.cacheService.del(CATEGORY_CACHE_KEYS.activeList);
    } catch {
      // Cache invalidation failure must not fail category writes.
    }
  }
}
