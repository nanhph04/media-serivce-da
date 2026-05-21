import { ApiProperty } from '@nestjs/swagger';
import type {
  AdminReportItemResponse,
  AdminReportsPageResponse,
} from '../../application/dtos/admin-report.response';

class AdminReportItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['user', 'auto_moderation'] })
  source!: string;

  @ApiProperty({ enum: ['video', 'channel'] })
  targetType!: string;

  @ApiProperty({ nullable: true })
  targetVideoId!: string | null;

  @ApiProperty({ nullable: true })
  targetChannelId!: string | null;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  reporterLabel!: string;

  @ApiProperty({ nullable: true })
  reporterUserId!: string | null;

  @ApiProperty()
  reason!: string;

  @ApiProperty({ nullable: true })
  confidencePercent!: number | null;

  @ApiProperty({ nullable: true })
  evidenceTimestampSeconds!: number | null;

  @ApiProperty({ nullable: true })
  contextVideoId!: string | null;

  @ApiProperty({ nullable: true })
  contextVideoTitle!: string | null;

  @ApiProperty({ enum: ['pending', 'resolved', 'dismissed', 'rejected'] })
  status!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty({ enum: ['low', 'medium', 'high', 'critical'] })
  priority!: string;

  static fromApplicationDto(
    dto: AdminReportItemResponse,
  ): AdminReportItemResponseDto {
    const response = new AdminReportItemResponseDto();
    response.id = dto.id;
    response.source = dto.source;
    response.targetType = dto.targetType;
    response.targetVideoId = dto.targetVideoId;
    response.targetChannelId = dto.targetChannelId;
    response.title = dto.title;
    response.reporterLabel = dto.reporterLabel;
    response.reporterUserId = dto.reporterUserId;
    response.reason = dto.reason;
    response.confidencePercent = dto.confidencePercent;
    response.evidenceTimestampSeconds = dto.evidenceTimestampSeconds;
    response.contextVideoId = dto.contextVideoId;
    response.contextVideoTitle = dto.contextVideoTitle;
    response.status = dto.status;
    response.createdAt = dto.createdAt.toISOString();
    response.priority = dto.priority;

    return response;
  }
}

class AdminReportsPaginationResponseDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}

export class AdminReportsResponseDto {
  @ApiProperty({ type: AdminReportItemResponseDto, isArray: true })
  items!: AdminReportItemResponseDto[];

  @ApiProperty({ type: AdminReportsPaginationResponseDto })
  pagination!: AdminReportsPaginationResponseDto;

  static fromApplicationDto(
    dto: AdminReportsPageResponse,
  ): AdminReportsResponseDto {
    const response = new AdminReportsResponseDto();
    response.items = dto.items.map((item) =>
      AdminReportItemResponseDto.fromApplicationDto(item),
    );
    response.pagination = dto.pagination;

    return response;
  }
}
