export const VIDEO_CACHE_TTL_SECONDS = {
  metadata: 600,
  discoveryList: 600,
} as const;

export const VIDEO_CACHE_KEYS = {
  metadata: (videoId: string): string => `video:${videoId}:metadata`,
  latest: (limit: number): string => `media_service:videos:latest:${limit}`,
  categoryLatest: (category: string, limit: number): string =>
    `media_service:videos:category:${category}:latest:${limit}`,
} as const;
