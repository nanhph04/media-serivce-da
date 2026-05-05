export type VideoModerationStatus =
  | 'SAFE'
  | 'PENDING_MANUAL_REVIEW'
  | 'REJECTED'
  | 'ERROR';

export interface VideoModerationCompletedEventData {
  videoId: string;
  status: VideoModerationStatus;
  isSafe: boolean;
  reason: string;
  confidence: number;
  evidenceTimestampSeconds: number | null;
  rawFileKey: string;
  resolutions: string[];
  userId: string;
}
