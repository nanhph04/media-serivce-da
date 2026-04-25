export const VIDEO_CACHE_TTL_SECONDS = {
  metadata: 600,
  discoveryList: 600,
} as const;

export const VIDEO_CACHE_KEYS = {
  metadata: (videoId: string): string => `video:${videoId}:metadata`,
  latestVersion: (): string => 'media_service:videos:latest:version',
  categoryLatestVersion: (): string =>
    'media_service:videos:category:latest:version',
  latest: (version: number, limit: number): string =>
    `media_service:videos:latest:v${version}:${limit}`,
  categoryLatest: (version: number, category: string, limit: number): string =>
    `media_service:videos:category:v${version}:${category}:latest:${limit}`,
} as const;
