export interface HandleVideoViewedCommand {
  eventId: string;
  data: {
    videoId: string;
    userId: string;
  };
}
