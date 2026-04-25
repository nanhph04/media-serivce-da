import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsInt,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  Min,
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

  @ApiPropertyOptional({ type: [String], default: [] })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsOptional()
  categories: string[] = [];

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
