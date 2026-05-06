export const VIDEO_VIEW_AGGREGATION = Symbol('VIDEO_VIEW_AGGREGATION');

export interface IVideoViewAggregation {
  recordViewedEvent(eventId: string, videoId: string): Promise<boolean>;
  getDirtyVideoIds(): Promise<string[]>;
  claimPendingViewDelta(videoId: string): Promise<number | null>;
  completeFlush(videoId: string): Promise<void>;
  restoreInflightViewDelta(videoId: string): Promise<void>;
}
