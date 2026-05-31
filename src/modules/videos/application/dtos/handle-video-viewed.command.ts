export interface HandleVideoViewedCommand {
  eventId: string;
  timestamp: string;
  data: {
    videoId: string;
    userId: string;
  };
}
