import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import type { VideoProgressSnapshot } from '../../application/dtos/video-progress.snapshot';
import type { IVideoProgressStream } from '../../application/interfaces/video-progress-stream.interface';

interface VideoProgressSubjectState {
  subject: Subject<VideoProgressSnapshot>;
  subscriberCount: number;
}

@Injectable()
export class VideoProgressStreamService implements IVideoProgressStream {
  private readonly streams = new Map<string, VideoProgressSubjectState>();

  observe(videoId: string): Observable<VideoProgressSnapshot> {
    return new Observable<VideoProgressSnapshot>((subscriber) => {
      const state = this.getOrCreateState(videoId);
      state.subscriberCount += 1;

      const subscription = state.subject.subscribe(subscriber);

      return () => {
        subscription.unsubscribe();
        state.subscriberCount -= 1;

        if (state.subscriberCount <= 0) {
          state.subject.complete();
          this.streams.delete(videoId);
        }
      };
    });
  }

  publish(snapshot: VideoProgressSnapshot): void {
    const state = this.streams.get(snapshot.videoId);
    state?.subject.next(snapshot);
  }

  private getOrCreateState(videoId: string): VideoProgressSubjectState {
    const current = this.streams.get(videoId);
    if (current) {
      return current;
    }

    const created: VideoProgressSubjectState = {
      subject: new Subject<VideoProgressSnapshot>(),
      subscriberCount: 0,
    };
    this.streams.set(videoId, created);
    return created;
  }
}
