import type { Observable } from 'rxjs';
import type { VideoStatusChangedEvent } from './video-status-event-publisher.interface';

export const VIDEO_STATUS_EVENT_STREAM = Symbol('VIDEO_STATUS_EVENT_STREAM');

export interface VideoStatusStreamMessage {
  type: 'video.status.changed';
  id: string;
  data: VideoStatusChangedEvent;
}

export interface IVideoStatusEventStream {
  streamForUser(userId: string): Observable<VideoStatusStreamMessage>;
}
