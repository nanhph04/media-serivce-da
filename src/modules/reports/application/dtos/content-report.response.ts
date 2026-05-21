import type {
  ContentReportStatus,
  ContentReportTargetType,
} from '../../domain/entities/content-report.entity';

export interface ContentReportResponse {
  id: string;
  targetType: ContentReportTargetType;
  reporterUserId: string;
  targetVideoId: string | null;
  targetChannelId: string;
  reason: string;
  evidenceTimestampSeconds: number | null;
  contextVideoId: string | null;
  contextVideoTitle: string | null;
  status: ContentReportStatus;
  createdAt: Date;
  updatedAt: Date;
}
