export interface ModerateChannelMembershipCommand {
  channelId: string;
  adminId: string;
  action: 'close' | 'open';
}
