import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminReportQueryDto {
  @ApiPropertyOptional({ enum: ['pending', 'rejected'] })
  status?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  page?: string;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  limit?: string;
}
