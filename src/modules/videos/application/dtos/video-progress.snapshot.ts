export type VideoProgressStage =
  | 'pending_moderation'
  | 'moderating'
  | 'processing'
  | 'ready'
  | 'pending_manual_review'
  | 'rejected'
  | 'failed';

export interface VideoProgressSnapshot {
  videoId: string;
  stage: VideoProgressStage;
  percent: number;
  message: string;
  terminal: boolean;
  updatedAt: string;
  detail?: Record<string, unknown> | null;
  errorCode?: string | null;
}
