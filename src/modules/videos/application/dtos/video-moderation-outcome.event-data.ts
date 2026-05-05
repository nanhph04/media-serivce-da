import type { VideoStatus } from '../../domain/entities/video.entity';
import type { VideoModerationStatus } from './video-moderation-completed.event-data';

export type VideoModerationOutcome =
  | 'QUEUED_FOR_PROCESSING'
  | 'PENDING_MANUAL_REVIEW'
  | 'REJECTED'
  | 'FAILED';

export interface VideoModerationOutcomeEventData {
  videoId: string;
  moderationStatus: VideoModerationStatus;
  videoStatus: VideoStatus;
  outcome: VideoModerationOutcome;
  reason: string;
  confidence: number;
  evidenceTimestampSeconds: number | null;
  transcodeQueued: boolean;
}
