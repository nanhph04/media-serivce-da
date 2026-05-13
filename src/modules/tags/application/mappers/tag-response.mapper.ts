import type { Tag } from '../../domain/entities/tag.entity';
import type { TagResponse } from '../dto/tag.response';

export function toTagResponse(tag: Tag): TagResponse {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    status: tag.status,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
  };
}
