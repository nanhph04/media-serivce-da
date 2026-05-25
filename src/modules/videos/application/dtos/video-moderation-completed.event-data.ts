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
  evidence?: VideoModerationEvidence | null;
  rawFileKey: string;
  resolutions: string[];
  userId: string;
}

export interface VideoModerationEvidence {
  label: string;
  safeScore: number;
  nsfwScore: number;
  timestampSeconds: number;
  sampledFrameCount: number;
  thresholds: {
    manual: number;
    reject: number;
  };
}
