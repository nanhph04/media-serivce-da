import type { VideoProcessedSuccessEventData } from './video-processed-success.event-data';

export interface HandleVideoProcessedSuccessCommand {
  eventId: string;
  data: VideoProcessedSuccessEventData;
}
