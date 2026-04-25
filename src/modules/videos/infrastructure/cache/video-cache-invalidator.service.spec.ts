import { VIDEO_CACHE_KEYS } from '../cache.constants';
import { VideoCacheInvalidator } from './video-cache-invalidator.service';

describe('VideoCacheInvalidator', () => {
  const cacheService = {
    del: jest.fn(),
    increment: jest.fn(),
  };
  const invalidator = new VideoCacheInvalidator(cacheService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes only metadata cache key', async () => {
    cacheService.del.mockResolvedValue(undefined);

    await invalidator.invalidateMetadata('video-1');

    expect(cacheService.del).toHaveBeenCalledWith(
      VIDEO_CACHE_KEYS.metadata('video-1'),
    );
  });

  it('does not fail when redis delete fails', async () => {
    cacheService.del.mockRejectedValue(new Error('redis unavailable'));

    await expect(
      invalidator.invalidateMetadata('video-1'),
    ).resolves.toBeUndefined();
  });

  it('invalidates discovery list cache patterns', async () => {
    cacheService.increment.mockResolvedValue(1);

    await invalidator.invalidateDiscoveryLists();

    expect(cacheService.increment).toHaveBeenNthCalledWith(
      1,
      VIDEO_CACHE_KEYS.latestVersion(),
    );
    expect(cacheService.increment).toHaveBeenNthCalledWith(
      2,
      VIDEO_CACHE_KEYS.categoryLatestVersion(),
    );
  });
});
