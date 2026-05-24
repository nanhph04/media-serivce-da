import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { toSlug } from '../../../../shared/domain/utils/slug.util';

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeLimit(value: unknown): number {
  const parsed =
    typeof value === 'number' ? value : Number.parseInt(String(value), 10);

  if (!Number.isFinite(parsed)) {
    return 20;
  }

  return Math.min(Math.max(parsed, 1), 50);
}

function normalizePage(value: unknown): number {
  const parsed =
    typeof value === 'number' ? value : Number.parseInt(String(value), 10);

  if (!Number.isFinite(parsed)) {
    return 1;
  }

  return Math.max(parsed, 1);
}

export class SearchContentRequestDto {
  @ApiPropertyOptional()
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsString()
  @MaxLength(200)
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({
    description: 'Category slug. Input is normalized to slug format.',
  })
  @Transform(({ value }) => {
    const normalized = normalizeOptionalString(value);
    return normalized ? toSlug(normalized) : undefined;
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ default: 20, maximum: 50, minimum: 1 })
  @Transform(({ value }) => normalizeLimit(value))
  @IsOptional()
  limit = 20;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Transform(({ value }) => normalizePage(value))
  @IsOptional()
  page = 1;
}
