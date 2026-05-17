import type { VideoThumbnailFailedEventData } from './video-thumbnail-failed.event-data';

export interface HandleVideoThumbnailFailedCommand {
  eventId: string;
  data: VideoThumbnailFailedEventData;
}
