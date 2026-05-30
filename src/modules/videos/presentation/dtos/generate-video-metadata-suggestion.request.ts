import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type {
  VideoMetadataSuggestionLanguage,
  VideoMetadataSuggestionTone,
} from '../../application/dtos/generate-video-metadata-suggestion.command';

const VIDEO_METADATA_SUGGESTION_LANGUAGES = ['vi', 'en'] as const;
const VIDEO_METADATA_SUGGESTION_TONES = [
  'natural',
  'professional',
  'seo',
] as const;

export class GenerateVideoMetadataSuggestionRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ default: '' })
  @IsString()
  @MaxLength(5000)
  @IsOptional()
  description = '';

  @ApiProperty()
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

  @ApiPropertyOptional({
    enum: VIDEO_METADATA_SUGGESTION_LANGUAGES,
    default: 'vi',
  })
  @IsIn(VIDEO_METADATA_SUGGESTION_LANGUAGES)
  @IsOptional()
  language: VideoMetadataSuggestionLanguage = 'vi';

  @ApiPropertyOptional({
    enum: VIDEO_METADATA_SUGGESTION_TONES,
    default: 'natural',
  })
  @IsIn(VIDEO_METADATA_SUGGESTION_TONES)
  @IsOptional()
  tone: VideoMetadataSuggestionTone = 'natural';

  @ApiPropertyOptional({ default: 1200, minimum: 200, maximum: 2000 })
  @IsInt()
  @Min(200)
  @Max(2000)
  @IsOptional()
  maxDescriptionLength = 1200;
}
