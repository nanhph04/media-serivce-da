export const VIDEO_PROCESSING_JOB_DISPATCHER = Symbol(
  'VIDEO_PROCESSING_JOB_DISPATCHER',
);

export interface VideoProcessingJobPayload {
  videoId: string;
  traceId: string;
  rawFileKey: string;
  resolution: string[];
  userId: string;
  thumbnailTargetObjectKey?: string;
  thumbnailTargetBucket?: string;
}

export interface VideoProcessingJobOptions {
  jobId?: string;
}

export interface IVideoProcessingJobDispatcher {
  enqueueTranscodeJob(
    payload: VideoProcessingJobPayload,
    options?: VideoProcessingJobOptions,
  ): Promise<void>;
}
