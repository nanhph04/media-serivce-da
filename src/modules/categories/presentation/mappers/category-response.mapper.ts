import type { CategoryResponse } from '../../application/dto/category.response';
import type { CategoryResponseDto } from '../dtos/category.response';

export function toCategoryResponseDto(
  source: CategoryResponse,
): CategoryResponseDto {
  return {
    id: source.id,
    name: source.name,
    slug: source.slug,
    description: source.description,
    parentId: source.parentId,
    status: source.status,
    displayOrder: source.displayOrder,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  };
}
