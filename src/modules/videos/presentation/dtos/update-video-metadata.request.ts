import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateVideoMetadataRequestDto {
  @ApiPropertyOptional()
  @IsString()
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  thumbnailUrl?: string | null;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ type: [String] })
  @Transform(({ value }: TransformFnParams): unknown =>
    Array.isArray(value)
      ? value.map((item: unknown) =>
          typeof item === 'string' ? item.trim() : item,
        )
      : value,
  )
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsOptional()
  tagIds?: string[];

  @ApiPropertyOptional({ enum: ['public', 'private'] })
  @IsIn(['public', 'private'])
  @IsOptional()
  visibility?: 'public' | 'private';

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsInt()
  @Min(1)
  @IsOptional()
  requiredTierLevel?: number | null;
}
