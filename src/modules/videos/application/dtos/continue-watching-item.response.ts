export interface ContinueWatchingItemResponse {
  videoId: string;
  channelId: string;
  title: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  resumePositionSeconds: number;
  remainingSeconds: number | null;
  lastWatchedAt: Date;
  viewCount: number;
}
