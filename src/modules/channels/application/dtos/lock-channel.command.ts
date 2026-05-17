export interface LockChannelCommand {
  channelId: string;
  adminId: string;
  action: 'lock' | 'unlock';
  reason?: string;
}
