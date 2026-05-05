export const VIDEO_MODERATION_REQUEST_PUBLISHER = Symbol(
  'VIDEO_MODERATION_REQUEST_PUBLISHER',
);

export interface VideoModerationRequestPayload {
  videoId: string;
  rawFileKey: string;
  rawBucket: string;
  resolution: string[];
  userId: string;
}

export interface IVideoModerationRequestPublisher {
  publishModerationRequested(
    payload: VideoModerationRequestPayload,
  ): Promise<void>;
}
