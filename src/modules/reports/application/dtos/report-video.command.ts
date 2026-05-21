export interface ReportVideoCommand {
  reporterUserId: string;
  videoId: string;
  reason: string;
  evidenceTimestampSeconds?: number | null;
}
