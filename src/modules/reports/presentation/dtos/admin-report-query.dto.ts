import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class AdminReportQueryDto {
  @ApiPropertyOptional({
    enum: ['pending', 'resolved', 'dismissed', 'rejected'],
  })
  @IsOptional()
  @IsIn(['pending', 'resolved', 'dismissed', 'rejected'])
  status?: 'pending' | 'resolved' | 'dismissed' | 'rejected';

  @ApiPropertyOptional({ enum: ['video', 'channel'] })
  @IsOptional()
  @IsIn(['video', 'channel'])
  targetType?: 'video' | 'channel';

  @ApiPropertyOptional({ enum: ['user', 'auto_moderation'] })
  @IsOptional()
  @IsIn(['user', 'auto_moderation'])
  source?: 'user' | 'auto_moderation';

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
