import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import {
  ArrayUnique,
  IsInt,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
  IsOptional,
} from 'class-validator';

const THUMBNAIL_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;

export class InitVideoUploadRequestDto {
  @ApiPropertyOptional({
    deprecated: true,
    description:
      'Deprecated: ignored by backend; channel is resolved from x-user-id.',
  })
  @IsString()
  @IsOptional()
  channelId?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ default: '' })
  @IsString()
  @IsOptional()
  description = '';

  @ApiProperty({ description: 'Primary category id.' })
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @ApiPropertyOptional({ type: [String], default: [] })
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
  tagIds: string[] = [];

  @ApiPropertyOptional({ enum: ['public', 'private'], default: 'public' })
  @IsIn(['public', 'private'])
  @IsOptional()
  visibility: 'public' | 'private' = 'public';

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  price = 0;

  @ApiPropertyOptional({ nullable: true })
  @IsInt()
  @Min(1)
  @IsOptional()
  requiredTierLevel?: number | null;

  @ApiPropertyOptional({
    enum: THUMBNAIL_EXTENSIONS,
    description:
      'Optional custom thumbnail extension. When provided, init-upload returns a thumbnail presigned upload URL.',
  })
  @Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsIn(THUMBNAIL_EXTENSIONS)
  @IsOptional()
  thumbnailExtension?: string;
}
