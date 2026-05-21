import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  ForbiddenException,
} from '@shared/domain/exceptions/domain.exception';
import {
  VideoStatus,
  type VideoEntity,
} from '../../../videos/domain/entities/video.entity';
import {
  VIDEO_REPOSITORY,
  type IVideoRepository,
} from '../../../videos/domain/repositories/video.repository';
import {
  ContentReportStatus,
  ContentReportTargetType,
  type ContentReportEntity,
} from '../../domain/entities/content-report.entity';
import {
  CONTENT_REPORT_REPOSITORY,
  type IContentReportRepository,
} from '../../domain/repositories/content-report.repository';
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
    @Inject(CONTENT_REPORT_REPOSITORY)
    private readonly contentReportRepository: IContentReportRepository,
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
    const source = this.parseSource(query.source);
    const targetType = this.parseTargetType(query.targetType);

    if (source === 'auto_moderation') {
      return this.listSyntheticReports(query.status, page, limit);
    }

    if (!source && query.status === 'rejected') {
      return this.listSyntheticReports(query.status, page, limit);
    }

    if (!source && !query.status && !targetType) {
      return this.listCombinedPendingReports(page, limit);
    }

    return this.listUserReports(query.status, targetType, page, limit);
  }

  private async listCombinedPendingReports(
    page: number,
    limit: number,
  ): Promise<AdminReportsPageResponse> {
    const [userReports, syntheticReports] = await Promise.all([
      this.contentReportRepository.findPage({
        status: ContentReportStatus.PENDING,
        page,
        limit,
      }),
      this.videoRepository.findAdminReports({
        status: VideoStatus.PENDING_MANUAL_REVIEW,
        page,
        limit,
      }),
    ]);
    const items = [
      ...userReports.items.map((report) => this.toUserReportItem(report)),
      ...syntheticReports.items.map((video) =>
        this.toSyntheticReportItem(video),
      ),
    ]
      .sort(
        (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
      )
      .slice(0, limit);
    const total = userReports.total + syntheticReports.total;

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  private async listUserReports(
    rawStatus: string | undefined,
    targetType: ContentReportTargetType | undefined,
    page: number,
    limit: number,
  ): Promise<AdminReportsPageResponse> {
    const result = await this.contentReportRepository.findPage({
      status: this.parseUserReportStatus(rawStatus),
      targetType,
      page,
      limit,
    });

    return {
      items: result.items.map((report) => this.toUserReportItem(report)),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.total === 0 ? 0 : Math.ceil(result.total / limit),
      },
    };
  }

  private async listSyntheticReports(
    rawStatus: string | undefined,
    page: number,
    limit: number,
  ): Promise<AdminReportsPageResponse> {
    const result = await this.videoRepository.findAdminReports({
      status: this.parseSyntheticStatus(rawStatus),
      page,
      limit,
    });

    return {
      items: result.items.map((video) => this.toSyntheticReportItem(video)),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.total === 0 ? 0 : Math.ceil(result.total / limit),
      },
    };
  }

  private toUserReportItem(
    report: ContentReportEntity,
  ): AdminReportItemResponse {
    return {
      id: report.id,
      source: 'user',
      targetType: report.targetType,
      targetVideoId: report.targetVideoId,
      targetChannelId: report.targetChannelId,
      title:
        report.targetType === ContentReportTargetType.VIDEO
          ? `Reported video ${report.targetVideoId ?? ''}`.trim()
          : `Reported channel ${report.targetChannelId}`,
      reporterLabel: report.reporterUserId,
      reporterUserId: report.reporterUserId,
      reason: report.reason,
      confidencePercent: null,
      evidenceTimestampSeconds: report.evidenceTimestampSeconds,
      contextVideoId: report.contextVideoId,
      contextVideoTitle: report.contextVideoTitle,
      status: report.status,
      createdAt: report.createdAt,
      priority: this.toUserReportPriority(report),
    };
  }

  private toSyntheticReportItem(video: VideoEntity): AdminReportItemResponse {
    const confidencePercent = this.toConfidencePercent(
      video.moderationDetails?.confidence,
    );

    return {
      id: video.id,
      source: 'auto_moderation',
      targetType: 'video',
      targetVideoId: video.id,
      targetChannelId: video.channelId,
      title: video.title,
      reporterLabel: 'Auto moderation',
      reporterUserId: null,
      reason:
        video.moderationDetails?.reason ??
        video.errorMessage ??
        'Pending manual review',
      confidencePercent,
      evidenceTimestampSeconds:
        video.moderationDetails?.evidenceTimestampSeconds ?? null,
      contextVideoId: null,
      contextVideoTitle: null,
      status:
        video.status === VideoStatus.REJECTED
          ? 'rejected'
          : ContentReportStatus.PENDING,
      createdAt: video.statusChangedAt,
      priority: this.toConfidencePriority(confidencePercent),
    };
  }

  private toUserReportPriority(
    report: ContentReportEntity,
  ): AdminReportPriority {
    if (
      report.targetType === ContentReportTargetType.VIDEO &&
      report.evidenceTimestampSeconds !== null
    ) {
      return 'high';
    }

    if (
      report.targetType === ContentReportTargetType.CHANNEL &&
      (report.contextVideoId !== null || report.contextVideoTitle !== null)
    ) {
      return 'medium';
    }

    return 'low';
  }

  private toConfidencePercent(confidence: number | undefined): number | null {
    if (confidence === undefined || !Number.isFinite(confidence)) {
      return null;
    }

    return Math.round(confidence * 100);
  }

  private toConfidencePriority(
    confidencePercent: number | null,
  ): AdminReportPriority {
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
      throw new ForbiddenException('Admin role is required');
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

  private parseSource(source?: string): 'user' | 'auto_moderation' | undefined {
    if (!source) {
      return undefined;
    }

    if (source === 'user' || source === 'auto_moderation') {
      return source;
    }

    throw new BadRequestException('Invalid report source');
  }

  private parseTargetType(
    targetType?: string,
  ): ContentReportTargetType | undefined {
    if (!targetType) {
      return undefined;
    }

    if (
      Object.values(ContentReportTargetType).includes(
        targetType as ContentReportTargetType,
      )
    ) {
      return targetType as ContentReportTargetType;
    }

    throw new BadRequestException('Invalid report target type');
  }

  private parseUserReportStatus(
    status?: string,
  ): ContentReportStatus | undefined {
    if (!status) {
      return undefined;
    }

    if (
      Object.values(ContentReportStatus).includes(status as ContentReportStatus)
    ) {
      return status as ContentReportStatus;
    }

    throw new BadRequestException('Invalid report status');
  }

  private parseSyntheticStatus(status?: string): VideoStatus {
    if (!status || status === 'pending') {
      return VideoStatus.PENDING_MANUAL_REVIEW;
    }

    if (status === 'rejected') {
      return VideoStatus.REJECTED;
    }

    throw new BadRequestException('Invalid report status');
  }
}
