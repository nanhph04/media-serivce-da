export const VIDEO_VIEW_CONFIG = Symbol('VIDEO_VIEW_CONFIG');

export interface IVideoViewConfig {
  getVideoViewDedupeTtlSeconds(): number;
  getVideoViewTopic(): string;
  getVideoViewMinSeconds(): number;
  getVideoViewMinPercent(): number;
  getVideoViewFlushIntervalSeconds(): number;
  getVideoViewDiscoveryInvalidationIntervalSeconds(): number;
}
