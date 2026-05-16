export interface ReviewChannelMembershipCommand {
  channelId: string;
  adminId: string;
  role: string | undefined;
  action: 'approve' | 'reject';
  reason?: string;
}
