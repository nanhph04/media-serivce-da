import type { VideoWatchProgressState } from '../../domain/entities/video-watch-progress.entity';

export interface UpdateVideoProgressCommand {
  userId: string;
  videoId: string;
  positionSeconds: number;
  durationSeconds?: number | null;
  state?: VideoWatchProgressState;
}
