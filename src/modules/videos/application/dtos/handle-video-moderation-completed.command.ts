import type { VideoModerationCompletedEventData } from './video-moderation-completed.event-data';

export interface HandleVideoModerationCompletedCommand {
  eventId: string;
  traceId: string;
  data: VideoModerationCompletedEventData;
}
