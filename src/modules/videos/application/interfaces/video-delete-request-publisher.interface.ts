import type { VideoDeleteRequestedEventData } from '../dtos/video-delete-requested.event-data';

export const VIDEO_DELETE_REQUEST_PUBLISHER = Symbol(
  'VIDEO_DELETE_REQUEST_PUBLISHER',
);

export interface IVideoDeleteRequestPublisher {
  publishVideoDeleteRequested(
    payload: VideoDeleteRequestedEventData,
  ): Promise<void>;
}
