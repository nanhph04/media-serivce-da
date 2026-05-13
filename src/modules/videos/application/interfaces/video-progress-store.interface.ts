import type { VideoProgressSnapshot } from '../dtos/video-progress.snapshot';

export const VIDEO_PROGRESS_STORE = Symbol('VIDEO_PROGRESS_STORE');

export interface IVideoProgressStore {
  get(videoId: string): Promise<VideoProgressSnapshot | null>;
  delete(videoId: string): Promise<void>;
  applyProgressUpdate(
    snapshot: VideoProgressSnapshot,
  ): Promise<VideoProgressSnapshot | null>;
}
