import type { VideoDeleteRefundCompletedEventData } from './video-delete-requested.event-data';

export interface HandleVideoDeleteRefundCompletedCommand {
  eventId: string;
  data: VideoDeleteRefundCompletedEventData;
}
