export const VIDEO_WORKER_HEALTH_CHECKER = Symbol(
  'VIDEO_WORKER_HEALTH_CHECKER',
);

export type VideoWorkerPipeline = 'moderation' | 'processing';

export interface IVideoWorkerHealthChecker {
  isHealthy(pipeline: VideoWorkerPipeline): Promise<boolean>;
}
