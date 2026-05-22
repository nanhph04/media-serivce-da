export const VIDEO_PROCESSING_JOB_DISPATCHER = Symbol(
  'VIDEO_PROCESSING_JOB_DISPATCHER',
);

export interface VideoProcessingJobPayload {
  videoId: string;
  rawFileKey: string;
  resolution: string[];
  userId: string;
  thumbnailTargetObjectKey?: string;
  thumbnailTargetBucket?: string;
}

export interface IVideoProcessingJobDispatcher {
  enqueueTranscodeJob(payload: VideoProcessingJobPayload): Promise<void>;
}
