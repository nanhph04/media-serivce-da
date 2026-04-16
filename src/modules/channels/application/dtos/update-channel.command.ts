export interface UpdateChannelCommand {
  channelId: string;
  userId: string;
  name?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
}
