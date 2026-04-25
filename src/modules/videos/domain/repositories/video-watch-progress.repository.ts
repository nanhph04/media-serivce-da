import type { VideoWatchProgressEntity } from '../entities/video-watch-progress.entity';

export const VIDEO_WATCH_PROGRESS_REPOSITORY = Symbol(
  'VIDEO_WATCH_PROGRESS_REPOSITORY',
);

export interface IVideoWatchProgressRepository {
  findByUserIdAndVideoId(
    userId: string,
    videoId: string,
  ): Promise<VideoWatchProgressEntity | null>;
  save(progress: VideoWatchProgressEntity): Promise<void>;
}
