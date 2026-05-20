import { Injectable, type MessageEvent } from '@nestjs/common';
import { filter, map, Observable, Subject } from 'rxjs';
import type {
  IVideoStatusEventPublisher,
  VideoStatusChangedEvent,
} from '../../application/interfaces/video-status-event-publisher.interface';

@Injectable()
export class VideoStatusSseService implements IVideoStatusEventPublisher {
  private readonly videoStatusEvents = new Subject<VideoStatusChangedEvent>();

  publishVideoStatusChanged(event: VideoStatusChangedEvent): void {
    this.videoStatusEvents.next(event);
  }

  streamForUser(userId: string): Observable<MessageEvent> {
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
