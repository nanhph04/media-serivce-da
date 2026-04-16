import type { VideoProcessedFailedEventData } from './video-processed-failed.event-data';

export interface HandleVideoProcessedFailedCommand {
  eventId: string;
  data: VideoProcessedFailedEventData;
}
