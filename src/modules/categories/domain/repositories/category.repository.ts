import type { Category } from '../entities/category.entity';

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

export interface ICategoryRepository {
  save(category: Category): Promise<void>;
  findById(id: string): Promise<Category | null>;
  findByIds(ids: string[]): Promise<Category[]>;
  findBySlug(slug: string): Promise<Category | null>;
  findAll(): Promise<Category[]>;
  findActive(): Promise<Category[]>;
  searchAll(keyword: string): Promise<Category[]>;
  searchActive(keyword: string): Promise<Category[]>;
  findBySlugs(slugs: string[]): Promise<Category[]>;
}
