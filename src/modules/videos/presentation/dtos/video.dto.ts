import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class InitVideoUploadRequestDto {
  @ApiProperty()
  @IsString()
  channelId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ default: '' })
  @IsString()
  @IsOptional()
  description = '';

  @ApiPropertyOptional({ default: 'general' })
  @IsString()
  @IsOptional()
  category = 'general';

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

export class ConfirmVideoUploadRequestDto {
  @ApiProperty({ type: [String], example: ['360p', '720p', '1080p'] })
  @IsArray()
  @IsString({ each: true })
  resolutions!: string[];
}

export class VideoResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  channelId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  price!: number;

  @ApiProperty({ nullable: true })
  requiredTierLevel!: number | null;

  @ApiProperty({ nullable: true })
  thumbnailUrl!: string | null;

  @ApiProperty({ nullable: true })
  durationSeconds!: number | null;

  @ApiProperty({ type: [String] })
  resolutions!: string[];

  @ApiProperty()
  viewCount!: number;

  @ApiProperty({ nullable: true })
  publishedAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
