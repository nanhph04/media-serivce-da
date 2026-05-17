import type { VideoThumbnailGeneratedEventData } from './video-thumbnail-generated.event-data';

export interface HandleVideoThumbnailGeneratedCommand {
  eventId: string;
  data: VideoThumbnailGeneratedEventData;
}
