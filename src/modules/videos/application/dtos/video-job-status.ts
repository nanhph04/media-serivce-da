import { VideoStatus, type VideoModerationDetails } from '../../domain/entities/video.entity';

export type VideoJobStatus =
  | 'waiting'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'rejected';

export interface VideoJobStatusFields {
  jobStatus: VideoJobStatus;
  jobStatusMessage: string;
  failureReason: string | null;
  moderationDetails: VideoModerationDetails | null;
}

export function mapVideoStatusToJobFields(input: {
  status: VideoStatus;
  errorMessage: string | null;
  moderationDetails: VideoModerationDetails | null;
}): VideoJobStatusFields {
  switch (input.status) {
    case VideoStatus.DRAFT:
      return buildFields('waiting', 'Upload initialized', null, input);
    case VideoStatus.PENDING_MODERATION:
      return buildFields(
        'waiting',
        'Video is waiting for moderation',
        null,
        input,
      );
    case VideoStatus.PENDING_MANUAL_REVIEW:
      return buildFields(
        'waiting',
        'Video is waiting for manual review',
        null,
        input,
      );
    case VideoStatus.PROCESSING:
      return buildFields('processing', 'Video is processing', null, input);
    case VideoStatus.READY:
      return buildFields(
        'succeeded',
        'Video processing completed',
        null,
        input,
      );
    case VideoStatus.REJECTED:
      return buildFields(
        'rejected',
        input.errorMessage ?? 'Video was rejected by moderation',
        input.errorMessage ?? 'Video was rejected by moderation',
        input,
      );
    case VideoStatus.FAILED:
    default:
      return buildFields(
        'failed',
        input.errorMessage ?? 'Video processing failed',
        input.errorMessage ?? 'Video processing failed',
        input,
      );
  }
}

function buildFields(
  jobStatus: VideoJobStatus,
  jobStatusMessage: string,
  failureReason: string | null,
  input: {
    moderationDetails: VideoModerationDetails | null;
  },
): VideoJobStatusFields {
  return {
    jobStatus,
    jobStatusMessage,
    failureReason,
    moderationDetails: input.moderationDetails,
  };
}
