import type { TagResponse } from '../../application/dto/tag.response';
import type { TagResponseDto } from '../dtos/tag.response';

export function toTagResponseDto(source: TagResponse): TagResponseDto {
  return {
    id: source.id,
    name: source.name,
    slug: source.slug,
    status: source.status,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  };
}
