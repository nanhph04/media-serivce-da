import { BadRequestException } from '../../../../shared/domain/exceptions/domain.exception';
import { toSlug } from '../../../../shared/domain/utils/slug.util';

export enum CategoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
}

export interface CategoryProps {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: CategoryStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Category {
  constructor(private readonly props: CategoryProps) {}

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get description(): string | null {
    return this.props.description;
  }

  get status(): CategoryStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static create(
    props: Omit<CategoryProps, 'id' | 'slug' | 'createdAt' | 'updatedAt'>,
  ): Category {
    const id = crypto.randomUUID();
    const normalizedName = props.name.trim();
    const slug = Category.convertNameToSlug(normalizedName);
    const createdAt = new Date();
    const updatedAt = new Date();

    Category.validateName(normalizedName);
    Category.validateSlug(slug);

    return new Category({
      id,
      slug,
      createdAt,
      updatedAt,
      ...props,
      name: normalizedName,
    });
  }

  static convertNameToSlug(name: string): string {
    return toSlug(name);
  }

  update(
    props: Partial<Pick<CategoryProps, 'name' | 'description'>>,
  ): void {
    if (props.name !== undefined) {
      const normalizedName = props.name.trim();
      const slug = Category.convertNameToSlug(normalizedName);

      Category.validateName(normalizedName);
      Category.validateSlug(slug);

      this.props.name = normalizedName;
      this.props.slug = slug;
    }

    if (props.description !== undefined) {
      this.props.description = props.description;
    }

    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.status = CategoryStatus.ACTIVE;
    this.props.updatedAt = new Date();
  }

  inactivate(): void {
    this.props.status = CategoryStatus.INACTIVE;
    this.props.updatedAt = new Date();
  }

  delete(): void {
    this.props.status = CategoryStatus.DELETED;
    this.props.updatedAt = new Date();
  }

  private static validateName(name: string): void {
    if (!name) {
      throw new BadRequestException('Category name is required');
    }

    if (name.length > 100) {
      throw new BadRequestException(
        'Category name must be less than or equal to 100 characters',
      );
    }
  }

  private static validateSlug(slug: string): void {
    if (!slug) {
      throw new BadRequestException('Category slug cannot be empty');
    }
  }
}
