export interface ModerateAdminVideoCommand {
  adminId: string;
  role: string | undefined;
  videoId: string;
  action: 'approve' | 'reject';
  reason?: string;
}
