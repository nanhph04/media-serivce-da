import type { ContentReportStatus } from '../../domain/entities/content-report.entity';

export type AdminReportPriority = 'low' | 'medium' | 'high' | 'critical';
export type AdminReportSource = 'user' | 'auto_moderation';
export type AdminReportTargetType = 'video' | 'channel';

export interface AdminReportsSummaryResponse {
  pendingReports: number;
  pendingManualReviewVideos: number;
  autoFlaggedVideos: number;
  rejectedLast30d: number;
  averageResolutionHours: number | null;
  pendingUserReports: number;
  pendingVideoReports: number;
  pendingChannelReports: number;
  resolvedUserReports: number;
  dismissedUserReports: number;
}

export interface AdminReportItemResponse {
  id: string;
  source: AdminReportSource;
  targetType: AdminReportTargetType;
  targetVideoId: string | null;
  targetChannelId: string | null;
  title: string;
  reporterLabel: string;
  reporterUserId: string | null;
  reason: string;
  confidencePercent: number | null;
  evidenceTimestampSeconds: number | null;
  contextVideoId: string | null;
  contextVideoTitle: string | null;
  status: ContentReportStatus | 'pending' | 'rejected';
  createdAt: Date;
  priority: AdminReportPriority;
}

export interface AdminReportsPageResponse {
  items: AdminReportItemResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
