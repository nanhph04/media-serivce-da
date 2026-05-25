import type { VideoModerationDetails } from '../../domain/entities/video.entity';

export interface AdminVideoPreviewResponse {
  videoId: string;
  previewUrl: string;
  expiresAt: Date;
  evidenceTimestampSeconds: number | null;
  moderationDetails: VideoModerationDetails | null;
}
