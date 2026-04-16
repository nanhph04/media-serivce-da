import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
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
