export interface PlayVideoResponse {
  videoId: string;
  title: string;
  description: string;
  playbackToken: string;
  playbackUrl: string;
  resumePositionSeconds: number;
  isResumeAvailable: boolean;
}
