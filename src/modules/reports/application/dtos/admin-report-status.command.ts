import type { ContentReportStatus } from '../../domain/entities/content-report.entity';

export interface UpdateAdminReportStatusCommand {
  adminId: string;
  role?: string;
  reportId: string;
  status: ContentReportStatus;
}
