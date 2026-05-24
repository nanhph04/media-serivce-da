import type { Category } from '../entities/category.entity';

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

export interface ICategoryRepository {
  save(category: Category): Promise<void>;
  findById(id: string): Promise<Category | null>;
  findByIds(ids: string[]): Promise<Category[]>;
  findBySlug(slug: string): Promise<Category | null>;
  findAll(): Promise<Category[]>;
  findAllPaged(
    page: number,
    limit: number,
  ): Promise<{
    items: Category[];
    total: number;
  }>;
  findActive(): Promise<Category[]>;
  findActivePaged(
    page: number,
    limit: number,
  ): Promise<{
    items: Category[];
    total: number;
  }>;
  searchAll(keyword: string): Promise<Category[]>;
  searchAllPaged(
    keyword: string,
    page: number,
    limit: number,
  ): Promise<{ items: Category[]; total: number }>;
  searchActive(keyword: string): Promise<Category[]>;
  searchActivePaged(
    keyword: string,
    page: number,
    limit: number,
  ): Promise<{ items: Category[]; total: number }>;
  findBySlugs(slugs: string[]): Promise<Category[]>;
}
