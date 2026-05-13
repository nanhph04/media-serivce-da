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
  publicSearchVersion: (): string =>
    'media_service:videos:public-search:version',
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
    version: number,
    q: string | undefined,
    category: string | undefined,
    tags: string | undefined,
    limit: number,
  ): string =>
    `media_service:search:global:v${version}:q:${q ?? ''}:category:${category ?? ''}:tags:${tags ?? ''}:limit:${limit}:videos`,
} as const;
