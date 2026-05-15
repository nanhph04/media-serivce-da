import { ApiProperty } from '@nestjs/swagger';
import type {
  AdminReportItemResponse,
  AdminReportsPageResponse,
} from '../../application/dtos/admin-report.response';

class AdminReportItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  targetVideoId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  reporterLabel!: string;

  @ApiProperty()
  reason!: string;

  @ApiProperty({ nullable: true })
  confidencePercent!: number | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty({ enum: ['low', 'medium', 'high', 'critical'] })
  priority!: string;

  static fromApplicationDto(
    dto: AdminReportItemResponse,
  ): AdminReportItemResponseDto {
    const response = new AdminReportItemResponseDto();
    response.id = dto.id;
    response.targetVideoId = dto.targetVideoId;
    response.title = dto.title;
    response.reporterLabel = dto.reporterLabel;
    response.reason = dto.reason;
    response.confidencePercent = dto.confidencePercent;
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
