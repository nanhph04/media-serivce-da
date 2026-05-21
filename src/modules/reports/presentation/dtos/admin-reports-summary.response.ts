import { ApiProperty } from '@nestjs/swagger';
import type { AdminReportsSummaryResponse } from '../../application/dtos/admin-report.response';

export class AdminReportsSummaryResponseDto {
  @ApiProperty()
  pendingReports!: number;

  @ApiProperty()
  pendingManualReviewVideos!: number;

  @ApiProperty()
  autoFlaggedVideos!: number;

  @ApiProperty()
  rejectedLast30d!: number;

  @ApiProperty({ nullable: true })
  averageResolutionHours!: number | null;

  @ApiProperty()
  pendingUserReports!: number;

  @ApiProperty()
  pendingVideoReports!: number;

  @ApiProperty()
  pendingChannelReports!: number;

  @ApiProperty()
  resolvedUserReports!: number;

  @ApiProperty()
  dismissedUserReports!: number;

  static fromApplicationDto(
    dto: AdminReportsSummaryResponse,
  ): AdminReportsSummaryResponseDto {
    const response = new AdminReportsSummaryResponseDto();
    response.pendingReports = dto.pendingReports;
    response.pendingManualReviewVideos = dto.pendingManualReviewVideos;
    response.autoFlaggedVideos = dto.autoFlaggedVideos;
    response.rejectedLast30d = dto.rejectedLast30d;
    response.averageResolutionHours = dto.averageResolutionHours;
    response.pendingUserReports = dto.pendingUserReports;
    response.pendingVideoReports = dto.pendingVideoReports;
    response.pendingChannelReports = dto.pendingChannelReports;
    response.resolvedUserReports = dto.resolvedUserReports;
    response.dismissedUserReports = dto.dismissedUserReports;

    return response;
  }
}
