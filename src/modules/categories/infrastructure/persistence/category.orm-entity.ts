import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CategoryStatus } from '../../domain/entities/category.entity';

@Entity('categories')
@Index(['slug'], { unique: true })
export class CategoryOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 120 })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 36, name: 'parent_id', nullable: true })
  parentId!: string | null;

  @Column({ type: 'enum', enum: CategoryStatus })
  status!: CategoryStatus;

  @Column({ type: 'int', name: 'display_order', default: 0 })
  displayOrder!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => CategoryOrmEntity, (category) => category.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_id' })
  parent!: CategoryOrmEntity | null;

  @OneToMany(() => CategoryOrmEntity, (category) => category.parent)
  children!: CategoryOrmEntity[];
}
