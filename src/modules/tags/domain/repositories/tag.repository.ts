import type { Tag } from '../entities/tag.entity';

export const TAG_REPOSITORY = Symbol('TAG_REPOSITORY');

export interface ITagRepository {
  save(tag: Tag): Promise<void>;
  findById(id: string): Promise<Tag | null>;
  findByIds(ids: string[]): Promise<Tag[]>;
  findBySlug(slug: string): Promise<Tag | null>;
  findBySlugs(slugs: string[]): Promise<Tag[]>;
  findAll(): Promise<Tag[]>;
  findAllPaged(
    page: number,
    limit: number,
  ): Promise<{
    items: Tag[];
    total: number;
  }>;
  findActive(): Promise<Tag[]>;
  findActivePaged(
    page: number,
    limit: number,
  ): Promise<{
    items: Tag[];
    total: number;
  }>;
  searchAll(keyword: string): Promise<Tag[]>;
  searchAllPaged(
    keyword: string,
    page: number,
    limit: number,
  ): Promise<{ items: Tag[]; total: number }>;
  searchActive(keyword: string): Promise<Tag[]>;
  searchActivePaged(
    keyword: string,
    page: number,
    limit: number,
  ): Promise<{ items: Tag[]; total: number }>;
}
