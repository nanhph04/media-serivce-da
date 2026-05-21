export interface ReportChannelCommand {
  reporterUserId: string;
  channelId: string;
  reason: string;
  reportedVideoId?: string;
  reportedVideoTitle?: string;
}
