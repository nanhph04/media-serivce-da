import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  ForbiddenException,
} from '@shared/domain/exceptions/domain.exception';
import {
  VIDEO_REPOSITORY,
  type IVideoRepository,
} from '../../../videos/domain/repositories/video.repository';
import {
  CONTENT_REPORT_REPOSITORY,
  type IContentReportRepository,
} from '../../domain/repositories/content-report.repository';
import type { AdminReportsSummaryResponse } from '../dtos/admin-report.response';
import type { GetAdminReportsSummaryQuery } from '../dtos/get-admin-reports-summary.query';

@Injectable()
export class GetAdminReportsSummaryUseCase extends BaseUseCase<
  GetAdminReportsSummaryQuery,
  AdminReportsSummaryResponse
> {
  constructor(
    @Inject(CONTENT_REPORT_REPOSITORY)
    private readonly contentReportRepository: IContentReportRepository,
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
  ) {
    super();
  }

  async execute(
    query: GetAdminReportsSummaryQuery,
  ): Promise<AdminReportsSummaryResponse> {
    this.ensureNonEmpty(query.adminId, 'Admin id is required');
    this.ensureAdminRole(query.role);

    const [userReportSummary, syntheticSummary] = await Promise.all([
      this.contentReportRepository.getSummary(),
      this.videoRepository.getAdminReportsSummary(new Date()),
    ]);

    return {
      pendingReports:
        syntheticSummary.pendingReports + userReportSummary.pendingUserReports,
      pendingManualReviewVideos: syntheticSummary.pendingManualReviewVideos,
      autoFlaggedVideos: syntheticSummary.autoFlaggedVideos,
      rejectedLast30d: syntheticSummary.rejectedLast30d,
      averageResolutionHours: syntheticSummary.averageResolutionHours,
      pendingUserReports: userReportSummary.pendingUserReports,
      pendingVideoReports: userReportSummary.pendingVideoReports,
      pendingChannelReports: userReportSummary.pendingChannelReports,
      resolvedUserReports: userReportSummary.resolvedUserReports,
      dismissedUserReports: userReportSummary.dismissedUserReports,
    };
  }

  private ensureNonEmpty(value: string, message: string): void {
    if (!value.trim()) {
      throw new BadRequestException(message);
    }
  }

  private ensureAdminRole(role: string | undefined): void {
    if (role !== 'admin') {
      throw new ForbiddenException('Admin role is required');
    }
  }
}
