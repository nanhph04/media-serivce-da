export const VIDEO_CACHE_TTL_SECONDS = {
  metadata: 600,
  discoveryList: 600,
  publicSearch: 60,
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
  categoryPage: (
    version: number,
    category: string,
    page: number,
    limit: number,
  ): string =>
    `media_service:videos:category:v${version}:${category}:page:${page}:limit:${limit}`,
  publicSearch: (
    q: string | undefined,
    category: string | undefined,
    limit: number,
  ): string =>
    `media_service:search:global:q:${q ?? ''}:category:${category ?? ''}:limit:${limit}:videos`,
} as const;
