import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { Tag, TagStatus } from '../../domain/entities/tag.entity';
import type { ITagRepository } from '../../domain/repositories/tag.repository';
import { TagOrmEntity } from './tag.orm-entity';

@Injectable()
export class TagRepositoryImpl implements ITagRepository {
  constructor(
    @InjectRepository(TagOrmEntity)
    private readonly ormRepository: Repository<TagOrmEntity>,
  ) {}

  async save(tag: Tag): Promise<void> {
    await this.ormRepository.save(this.toOrm(tag));
  }

  async findById(id: string): Promise<Tag | null> {
    const row = await this.ormRepository.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByIds(ids: string[]): Promise<Tag[]> {
    if (ids.length === 0) {
      return [];
    }

    const rows = await this.ormRepository.find({ where: { id: In(ids) } });
    return rows.map((row) => this.toDomain(row));
  }

  async findBySlug(slug: string): Promise<Tag | null> {
    const row = await this.ormRepository.findOne({ where: { slug } });
    return row ? this.toDomain(row) : null;
  }

  async findBySlugs(slugs: string[]): Promise<Tag[]> {
    if (slugs.length === 0) {
      return [];
    }

    const rows = await this.ormRepository.find({ where: { slug: In(slugs) } });
    return rows.map((row) => this.toDomain(row));
  }

  async findAll(): Promise<Tag[]> {
    const rows = await this.ormRepository.find({
      order: { name: 'ASC', createdAt: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findAllPaged(
    page: number,
    limit: number,
  ): Promise<{ items: Tag[]; total: number }> {
    const [rows, total] = await this.ormRepository.findAndCount({
      order: { name: 'ASC', createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items: rows.map((row) => this.toDomain(row)), total };
  }

  async findActive(): Promise<Tag[]> {
    const rows = await this.ormRepository.find({
      where: { status: TagStatus.ACTIVE },
      order: { name: 'ASC', createdAt: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findActivePaged(
    page: number,
    limit: number,
  ): Promise<{ items: Tag[]; total: number }> {
    const [rows, total] = await this.ormRepository.findAndCount({
      where: { status: TagStatus.ACTIVE },
      order: { name: 'ASC', createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items: rows.map((row) => this.toDomain(row)), total };
  }

  async searchAll(keyword: string): Promise<Tag[]> {
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
  ): Promise<{ items: Tag[]; total: number }> {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      return this.findAllPaged(page, limit);
    }

    return this.searchByKeywordPaged(normalizedKeyword, page, limit);
  }

  async searchActive(keyword: string): Promise<Tag[]> {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      return this.findActive();
    }

    const rows = await this.searchByKeyword(
      normalizedKeyword,
      TagStatus.ACTIVE,
    );
    return rows.map((row) => this.toDomain(row));
  }

  async searchActivePaged(
    keyword: string,
    page: number,
    limit: number,
  ): Promise<{ items: Tag[]; total: number }> {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      return this.findActivePaged(page, limit);
    }

    return this.searchByKeywordPaged(
      normalizedKeyword,
      page,
      limit,
      TagStatus.ACTIVE,
    );
  }

  private async searchByKeyword(
    normalizedKeyword: string,
    status?: TagStatus,
  ): Promise<TagOrmEntity[]> {
    const partial = `%${escapeLikePattern(normalizedKeyword)}%`;
    const queryBuilder = this.ormRepository.createQueryBuilder('tag').where(
      `(
          LOWER(tag.name) LIKE :partial ESCAPE '\\'
          OR LOWER(tag.slug) LIKE :partial ESCAPE '\\'
        )`,
      { partial },
    );

    if (status) {
      queryBuilder.andWhere('tag.status = :status', { status });
    }

    return queryBuilder
      .orderBy('tag.name', 'ASC')
      .addOrderBy('tag.createdAt', 'ASC')
      .getMany();
  }

  private async searchByKeywordPaged(
    normalizedKeyword: string,
    page: number,
    limit: number,
    status?: TagStatus,
  ): Promise<{ items: Tag[]; total: number }> {
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
    status?: TagStatus,
  ): SelectQueryBuilder<TagOrmEntity> {
    const partial = `%${escapeLikePattern(normalizedKeyword)}%`;
    const queryBuilder = this.ormRepository.createQueryBuilder('tag').where(
      `(
          LOWER(tag.name) LIKE :partial ESCAPE '\\'
          OR LOWER(tag.slug) LIKE :partial ESCAPE '\\'
        )`,
      { partial },
    );

    if (status) {
      queryBuilder.andWhere('tag.status = :status', { status });
    }

    return queryBuilder
      .orderBy('tag.name', 'ASC')
      .addOrderBy('tag.createdAt', 'ASC');
  }

  private toOrm(tag: Tag): TagOrmEntity {
    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      status: tag.status,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };
  }

  private toDomain(row: TagOrmEntity): Tag {
    return new Tag({
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}
