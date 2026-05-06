export type VideoProgressPipeline = 'moderation' | 'processing';

export interface VideoProgressUpdatedEventData {
  videoId: string;
  pipeline: VideoProgressPipeline;
  stage: string;
  percent: number;
  message: string;
  terminal: boolean;
  errorMessage?: string;
}
