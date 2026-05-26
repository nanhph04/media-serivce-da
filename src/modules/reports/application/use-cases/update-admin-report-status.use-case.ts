import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import { ContentReportStatus } from '../../domain/entities/content-report.entity';
import {
  CONTENT_REPORT_REPOSITORY,
  type IContentReportRepository,
} from '../../domain/repositories/content-report.repository';
import type { ContentReportResponse } from '../dtos/content-report.response';
import type { UpdateAdminReportStatusCommand } from '../dtos/admin-report-status.command';
import { toContentReportResponse } from '../mappers/content-report-response.mapper';

@Injectable()
export class UpdateAdminReportStatusUseCase extends BaseUseCase<
  UpdateAdminReportStatusCommand,
  ContentReportResponse
> {
  constructor(
    @Inject(CONTENT_REPORT_REPOSITORY)
    private readonly contentReportRepository: IContentReportRepository,
  ) {
    super();
  }

  async execute(
    command: UpdateAdminReportStatusCommand,
  ): Promise<ContentReportResponse> {
    this.ensureNonEmpty(command.adminId, 'Admin id is required');
    this.ensureAdminRole(command.role);

    if (
      command.status !== ContentReportStatus.RESOLVED &&
      command.status !== ContentReportStatus.DISMISSED
    ) {
      throw new BadRequestException(ERROR_MESSAGES.REPORT_STATUS_INVALID);
    }

    const report = await this.contentReportRepository.findById(
      command.reportId,
    );
    if (!report) {
      throw new NotFoundException(ERROR_MESSAGES.REPORT_NOT_FOUND);
    }

    report.updateStatus(command.status);
    await this.contentReportRepository.save(report);

    return toContentReportResponse(report);
  }

  private ensureNonEmpty(value: string, message: string): void {
    if (!value.trim()) {
      throw new BadRequestException(message);
    }
  }

  private ensureAdminRole(role: string | undefined): void {
    if (role !== 'admin') {
      throw new ForbiddenException(ERROR_MESSAGES.ADMIN_ROLE_REQUIRED);
    }
  }
}
