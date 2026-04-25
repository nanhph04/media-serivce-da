export const VIDEO_CACHE_INVALIDATOR = Symbol('VIDEO_CACHE_INVALIDATOR');

export interface IVideoCacheInvalidator {
  invalidateMetadata(videoId: string): Promise<void>;
  invalidateDiscoveryLists(): Promise<void>;
}
