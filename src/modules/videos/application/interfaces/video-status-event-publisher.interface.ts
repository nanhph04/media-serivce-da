import type {
  VideoModerationDetails,
  VideoStatus,
  VideoThumbnailStatus,
} from '../../domain/entities/video.entity';
import type { VideoJobStatus } from '../dtos/video-job-status';

export const VIDEO_STATUS_EVENT_PUBLISHER = Symbol(
  'VIDEO_STATUS_EVENT_PUBLISHER',
);

export interface VideoStatusChangedEvent {
  videoId: string;
  userId: string;
  status: VideoStatus;
  jobStatus: VideoJobStatus;
  jobStatusMessage: string;
  failureReason: string | null;
  thumbnailStatus: VideoThumbnailStatus;
  thumbnailUrl: string | null;
  moderationDetails: VideoModerationDetails | null;
  updatedAt: string;
}

export interface IVideoStatusEventPublisher {
  publishVideoStatusChanged(event: VideoStatusChangedEvent): void;
}
