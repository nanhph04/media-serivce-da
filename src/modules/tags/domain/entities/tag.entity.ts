import { BadRequestException } from '@shared/domain/exceptions/domain.exception';
import { toSlug } from '../../../../shared/domain/utils/slug.util';

export enum TagStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  DELETED = 'deleted',
}

export interface TagProps {
  id: string;
  name: string;
  slug: string;
  status: TagStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Tag {
  constructor(private readonly props: TagProps) {}

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get status(): TagStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static create(
    props: Omit<TagProps, 'id' | 'slug' | 'createdAt' | 'updatedAt'>,
  ): Tag {
    const name = props.name.trim();
    const slug = Tag.convertNameToSlug(name);
    const now = new Date();

    Tag.validateName(name);
    Tag.validateSlug(slug);

    return new Tag({
      id: crypto.randomUUID(),
      name,
      slug,
      status: props.status,
      createdAt: now,
      updatedAt: now,
    });
  }

  static convertNameToSlug(name: string): string {
    return toSlug(name);
  }

  update(input: { name?: string; status?: TagStatus }): void {
    if (input.name !== undefined) {
      const name = input.name.trim();
      const slug = Tag.convertNameToSlug(name);

      Tag.validateName(name);
      Tag.validateSlug(slug);

      this.props.name = name;
      this.props.slug = slug;
    }

    if (input.status !== undefined) {
      this.props.status = input.status;
    }

    this.props.updatedAt = new Date();
  }

  private static validateName(name: string): void {
    if (!name) {
      throw new BadRequestException('Tag name is required');
    }

    if (name.length > 100) {
      throw new BadRequestException(
        'Tag name must be less than or equal to 100 characters',
      );
    }
  }

  private static validateSlug(slug: string): void {
    if (!slug) {
      throw new BadRequestException('Tag slug cannot be empty');
    }
  }
}
