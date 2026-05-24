import type { VideoWorkerPipeline } from './video-worker-health-checker.interface';

export const VIDEO_WATCHDOG_HEALTH_FAILURE_STORE = Symbol(
  'VIDEO_WATCHDOG_HEALTH_FAILURE_STORE',
);

export interface IVideoWatchdogHealthFailureStore {
  increment(pipeline: VideoWorkerPipeline, ttlSeconds: number): Promise<number>;
  reset(pipeline: VideoWorkerPipeline): Promise<void>;
}
