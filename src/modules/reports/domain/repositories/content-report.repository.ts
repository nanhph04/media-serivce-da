import type {
  ContentReportEntity,
  ContentReportStatus,
  ContentReportTargetType,
} from '../entities/content-report.entity';

export const CONTENT_REPORT_REPOSITORY = Symbol('CONTENT_REPORT_REPOSITORY');

export interface ContentReportPageFilters {
  status?: ContentReportStatus;
  targetType?: ContentReportTargetType;
  page: number;
  limit: number;
}

export interface ContentReportPage {
  items: ContentReportEntity[];
  total: number;
}

export interface ContentReportSummary {
  pendingUserReports: number;
  pendingVideoReports: number;
  pendingChannelReports: number;
  resolvedUserReports: number;
  dismissedUserReports: number;
}

export interface IContentReportRepository {
  save(report: ContentReportEntity): Promise<void>;
  findById(id: string): Promise<ContentReportEntity | null>;
  findPendingByReporterAndTarget(input: {
    reporterUserId: string;
    targetType: ContentReportTargetType;
    targetVideoId?: string | null;
    targetChannelId: string;
  }): Promise<ContentReportEntity | null>;
  findPage(filters: ContentReportPageFilters): Promise<ContentReportPage>;
  getSummary(): Promise<ContentReportSummary>;
}
