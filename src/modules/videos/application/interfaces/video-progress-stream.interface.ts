import type { Observable } from 'rxjs';
import type { VideoProgressSnapshot } from '../dtos/video-progress.snapshot';

export const VIDEO_PROGRESS_STREAM = Symbol('VIDEO_PROGRESS_STREAM');

export interface IVideoProgressStream {
  observe(videoId: string): Observable<VideoProgressSnapshot>;
  publish(snapshot: VideoProgressSnapshot): void;
}
