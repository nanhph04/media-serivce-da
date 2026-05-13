import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTagRequestDto {
  @ApiPropertyOptional()
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive', 'pending', 'deleted'] })
  @IsIn(['active', 'inactive', 'pending', 'deleted'])
  @IsOptional()
  status?: string;
}
