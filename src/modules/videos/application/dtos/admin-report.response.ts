export type AdminReportPriority = 'low' | 'medium' | 'high' | 'critical';

export interface AdminReportsSummaryResponse {
  pendingReports: number;
  pendingManualReviewVideos: number;
  autoFlaggedVideos: number;
  rejectedLast30d: number;
  averageResolutionHours: number | null;
}

export interface AdminReportItemResponse {
  id: string;
  targetVideoId: string;
  title: string;
  reporterLabel: string;
  reason: string;
  confidencePercent: number | null;
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
