import type { Tag } from '../entities/tag.entity';

export const TAG_REPOSITORY = Symbol('TAG_REPOSITORY');

export interface ITagRepository {
  save(tag: Tag): Promise<void>;
  findById(id: string): Promise<Tag | null>;
  findByIds(ids: string[]): Promise<Tag[]>;
  findBySlug(slug: string): Promise<Tag | null>;
  findBySlugs(slugs: string[]): Promise<Tag[]>;
  findAll(): Promise<Tag[]>;
  findActive(): Promise<Tag[]>;
  searchAll(keyword: string): Promise<Tag[]>;
  searchActive(keyword: string): Promise<Tag[]>;
}
