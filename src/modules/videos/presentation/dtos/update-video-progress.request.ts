import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateVideoProgressRequestDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  positionSeconds!: number;

  @ApiPropertyOptional({ nullable: true })
  @IsInt()
  @Min(0)
  @IsOptional()
  durationSeconds?: number | null;

  @ApiPropertyOptional({ enum: ['watching', 'paused', 'completed'] })
  @IsIn(['watching', 'paused', 'completed'])
  @IsOptional()
  state?: 'watching' | 'paused' | 'completed';
}
