import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  ForbiddenException,
} from '@shared/domain/exceptions/domain.exception';
import {
  VideoStatus,
  type VideoEntity,
} from '../../domain/entities/video.entity';
import {
  VIDEO_REPOSITORY,
  type IVideoRepository,
} from '../../domain/repositories/video.repository';
import type {
  AdminReportItemResponse,
  AdminReportPriority,
  AdminReportsPageResponse,
} from '../dtos/admin-report.response';
import type { ListAdminReportsQuery } from '../dtos/list-admin-reports.query';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class ListAdminReportsUseCase extends BaseUseCase<
  ListAdminReportsQuery,
  AdminReportsPageResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
  ) {
    super();
  }

  async execute(
    query: ListAdminReportsQuery,
  ): Promise<AdminReportsPageResponse> {
    this.ensureNonEmpty(query.adminId, 'Admin id is required');
    this.ensureAdminRole(query.role);

    const page = this.normalizePositiveInteger(query.page, DEFAULT_PAGE);
    const limit = Math.min(
      this.normalizePositiveInteger(query.limit, DEFAULT_LIMIT),
      MAX_LIMIT,
    );
    const status = this.parseStatus(query.status);
    const result = await this.videoRepository.findAdminReports({
      status,
      page,
      limit,
    });

    return {
      items: result.items.map((video) => this.toReportItem(video)),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  private toReportItem(video: VideoEntity): AdminReportItemResponse {
    const confidencePercent = this.toConfidencePercent(
      video.moderationDetails?.confidence,
    );

    return {
      id: video.id,
      targetVideoId: video.id,
      title: video.title,
      reporterLabel: 'Auto moderation',
      reason:
        video.moderationDetails?.reason ??
        video.errorMessage ??
        'Pending manual review',
      confidencePercent,
      createdAt: video.statusChangedAt,
      priority: this.toPriority(confidencePercent),
    };
  }

  private toConfidencePercent(confidence: number | undefined): number | null {
    if (confidence === undefined || !Number.isFinite(confidence)) {
      return null;
    }

    return Math.round(confidence * 100);
  }

  private toPriority(confidencePercent: number | null): AdminReportPriority {
    if (confidencePercent === null) {
      return 'low';
    }

    if (confidencePercent >= 90) {
      return 'critical';
    }

    if (confidencePercent >= 75) {
      return 'high';
    }

    if (confidencePercent >= 50) {
      return 'medium';
    }

    return 'low';
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

  private normalizePositiveInteger(
    value: number | undefined,
    fallback: number,
  ): number {
    if (value === undefined || !Number.isInteger(value) || value < 1) {
      return fallback;
    }

    return value;
  }

  private parseStatus(status?: string): VideoStatus {
    if (!status || status === 'pending') {
      return VideoStatus.PENDING_MANUAL_REVIEW;
    }

    if (status === 'rejected') {
      return VideoStatus.REJECTED;
    }

    throw new BadRequestException(ERROR_MESSAGES.REPORT_STATUS_INVALID);
  }
}
