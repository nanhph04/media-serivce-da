import type { VideoModerationOutcomeEventData } from '../dtos/video-moderation-outcome.event-data';

export const VIDEO_MODERATION_OUTCOME_PUBLISHER = Symbol(
  'VIDEO_MODERATION_OUTCOME_PUBLISHER',
);

export interface IVideoModerationOutcomePublisher {
  publishModerationOutcome(
    payload: VideoModerationOutcomeEventData,
  ): Promise<void>;
}
