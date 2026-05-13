import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import {
  ArrayUnique,
  IsInt,
  IsArray,
  IsIn,
  IsString,
  MaxLength,
  Min,
  IsOptional,
} from 'class-validator';

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

  @ApiPropertyOptional({
    description:
      'Primary category id. Preferred over the deprecated categories field.',
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    type: [String],
    deprecated: true,
    description: 'Deprecated: use categoryId. Only one slug is accepted.',
  })
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
  categories?: string[];

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
}
