import { Injectable } from '@nestjs/common';
import { filter, map, Observable, Subject } from 'rxjs';
import type {
  IVideoStatusEventPublisher,
  VideoStatusChangedEvent,
} from '../../application/interfaces/video-status-event-publisher.interface';
import type {
  IVideoStatusEventStream,
  VideoStatusStreamMessage,
} from '../../application/interfaces/video-status-event-stream.interface';

@Injectable()
export class VideoStatusSseService
  implements IVideoStatusEventPublisher, IVideoStatusEventStream
{
  private readonly videoStatusEvents = new Subject<VideoStatusChangedEvent>();

  publishVideoStatusChanged(event: VideoStatusChangedEvent): void {
    this.videoStatusEvents.next(event);
  }

  streamForUser(userId: string): Observable<VideoStatusStreamMessage> {
    return this.videoStatusEvents.asObservable().pipe(
      filter((event) => event.userId === userId),
      map((event) => ({
        type: 'video.status.changed',
        id: `${event.videoId}:${event.updatedAt}`,
        data: event,
      })),
    );
  }
}
