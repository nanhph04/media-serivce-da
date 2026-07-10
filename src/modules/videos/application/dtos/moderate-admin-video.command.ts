export interface ModerateAdminVideoCommand {
  adminId: string;
  traceId: string;
  role: string | undefined;
  videoId: string;
  action: 'approve' | 'reject';
  reason?: string;
}
