import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CacheService } from '@shared/infrastructure/cache/cache.service';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import {
  Category,
  CategoryStatus,
} from '../../domain/entities/category.entity';
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
  parentId: string | null;
  displayOrder: number;
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

  async findByIds(ids: string[]): Promise<Category[]> {
    if (ids.length === 0) {
      return [];
    }

    const rows = await this.ormRepository.find({ where: { id: In(ids) } });
    return rows.map((row) => this.toDomain(row));
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const row = await this.ormRepository.findOne({ where: { slug } });
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<Category[]> {
    const rows = await this.ormRepository.find({
      order: { displayOrder: 'ASC', name: 'ASC', createdAt: 'ASC' },
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
      order: { displayOrder: 'ASC', name: 'ASC', createdAt: 'ASC' },
    });

    await this.setActiveCategoriesCache(rows);

    return rows.map((row) => this.toDomain(row));
  }

  async findAllPaged(
    page: number,
    limit: number,
  ): Promise<{ items: Category[]; total: number }> {
    const [rows, total] = await this.ormRepository.findAndCount({
      order: { displayOrder: 'ASC', name: 'ASC', createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items: rows.map((row) => this.toDomain(row)), total };
  }

  async findActivePaged(
    page: number,
    limit: number,
  ): Promise<{ items: Category[]; total: number }> {
    const [rows, total] = await this.ormRepository.findAndCount({
      where: { status: CategoryStatus.ACTIVE },
      order: { displayOrder: 'ASC', name: 'ASC', createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items: rows.map((row) => this.toDomain(row)), total };
  }

  async searchAll(keyword: string): Promise<Category[]> {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      return this.findAll();
    }

    const rows = await this.searchByKeyword(normalizedKeyword);
    return rows.map((row) => this.toDomain(row));
  }

  async searchAllPaged(
    keyword: string,
    page: number,
    limit: number,
  ): Promise<{ items: Category[]; total: number }> {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      return this.findAllPaged(page, limit);
    }

    return this.searchByKeywordPaged(normalizedKeyword, page, limit);
  }

  async searchActive(keyword: string): Promise<Category[]> {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      return this.findActive();
    }

    const rows = await this.searchByKeyword(
      normalizedKeyword,
      CategoryStatus.ACTIVE,
    );

    return rows.map((row) => this.toDomain(row));
  }

  async searchActivePaged(
    keyword: string,
    page: number,
    limit: number,
  ): Promise<{ items: Category[]; total: number }> {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      return this.findActivePaged(page, limit);
    }

    return this.searchByKeywordPaged(
      normalizedKeyword,
      page,
      limit,
      CategoryStatus.ACTIVE,
    );
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
      parentId: category.parentId,
      status: category.status,
      displayOrder: category.displayOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      parent: null,
      children: [],
    };
  }

  private async searchByKeyword(
    normalizedKeyword: string,
    status?: CategoryStatus,
  ): Promise<CategoryOrmEntity[]> {
    const partial = `%${escapeLikePattern(normalizedKeyword)}%`;
    const queryBuilder = this.ormRepository
      .createQueryBuilder('category')
      .where(
        `(
          LOWER(category.name) LIKE :partial ESCAPE '\\'
          OR LOWER(category.slug) LIKE :partial ESCAPE '\\'
        )`,
        { partial },
      );

    if (status) {
      queryBuilder.andWhere('category.status = :status', { status });
    }

    return queryBuilder
      .orderBy('category.name', 'ASC')
      .addOrderBy('category.createdAt', 'ASC')
      .getMany();
  }

  private async searchByKeywordPaged(
    normalizedKeyword: string,
    page: number,
    limit: number,
    status?: CategoryStatus,
  ): Promise<{ items: Category[]; total: number }> {
    const [rows, total] = await this.buildSearchByKeywordQuery(
      normalizedKeyword,
      status,
    )
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items: rows.map((row) => this.toDomain(row)), total };
  }

  private buildSearchByKeywordQuery(
    normalizedKeyword: string,
    status?: CategoryStatus,
  ): SelectQueryBuilder<CategoryOrmEntity> {
    const partial = `%${escapeLikePattern(normalizedKeyword)}%`;
    const queryBuilder = this.ormRepository
      .createQueryBuilder('category')
      .where(
        `(
          LOWER(category.name) LIKE :partial ESCAPE '\\'
          OR LOWER(category.slug) LIKE :partial ESCAPE '\\'
        )`,
        { partial },
      );

    if (status) {
      queryBuilder.andWhere('category.status = :status', { status });
    }

    return queryBuilder
      .orderBy('category.name', 'ASC')
      .addOrderBy('category.createdAt', 'ASC');
  }

  private toDomain(row: CategoryOrmEntity): Category {
    return new Category({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      parentId: row.parentId,
      status: row.status,
      displayOrder: row.displayOrder,
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
      parentId: row.parentId,
      status: row.status,
      displayOrder: row.displayOrder,
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
      parentId: row.parentId,
      displayOrder: row.displayOrder,
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

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}
