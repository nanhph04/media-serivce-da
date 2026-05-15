import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  ForbiddenException,
} from '@shared/domain/exceptions/domain.exception';
import type { AdminReportsSummaryResponse } from '../dtos/admin-report.response';
import type { GetAdminReportsSummaryQuery } from '../dtos/get-admin-reports-summary.query';
import {
  VIDEO_REPOSITORY,
  type IVideoRepository,
} from '../../domain/repositories/video.repository';

@Injectable()
export class GetAdminReportsSummaryUseCase extends BaseUseCase<
  GetAdminReportsSummaryQuery,
  AdminReportsSummaryResponse
> {
  constructor(
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

    return this.videoRepository.getAdminReportsSummary(new Date());
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
