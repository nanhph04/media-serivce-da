import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { ContentReportStatus } from '../../domain/entities/content-report.entity';

export class AdminReportStatusRequestDto {
  @ApiProperty({ enum: ['resolved', 'dismissed'] })
  @IsIn([ContentReportStatus.RESOLVED, ContentReportStatus.DISMISSED])
  status!: ContentReportStatus.RESOLVED | ContentReportStatus.DISMISSED;
}
