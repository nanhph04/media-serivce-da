import type { ContentReportResponse } from '../dtos/content-report.response';
import type { ContentReportEntity } from '../../domain/entities/content-report.entity';

export function toContentReportResponse(
  report: ContentReportEntity,
): ContentReportResponse {
  return {
    id: report.id,
    targetType: report.targetType,
    reporterUserId: report.reporterUserId,
    targetVideoId: report.targetVideoId,
    targetChannelId: report.targetChannelId,
    reason: report.reason,
    evidenceTimestampSeconds: report.evidenceTimestampSeconds,
    contextVideoId: report.contextVideoId,
    contextVideoTitle: report.contextVideoTitle,
    status: report.status,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}
