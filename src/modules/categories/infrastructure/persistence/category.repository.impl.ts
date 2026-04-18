import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Category } from '../../domain/entities/category.entity';
import type { ICategoryRepository } from '../../domain/repositories/category.repository';
import { CategoryOrmEntity } from './category.orm-entity';

@Injectable()
export class CategoryRepositoryImpl implements ICategoryRepository {
  constructor(
    @InjectRepository(CategoryOrmEntity)
    private readonly ormRepository: Repository<CategoryOrmEntity>,
  ) {}

  async save(category: Category): Promise<void> {
    await this.ormRepository.save(this.toOrm(category));
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
}
