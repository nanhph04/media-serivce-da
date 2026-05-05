import { HandleVideoViewedUseCase } from './handle-video-viewed.use-case';

describe('HandleVideoViewedUseCase', () => {
  const videoRepository = {
    findBasicById: jest.fn(),
    incrementViewCount: jest.fn(),
  };
  const eligibilityService = {
    syncChannelEligibility: jest.fn(),
  };
  const videoCacheInvalidator = {
    invalidateMetadata: jest.fn(),
    invalidateDiscoveryLists: jest.fn(),
  };
  const cacheService = {
    setIfNotExists: jest.fn(),
  };

  const useCase = new HandleVideoViewedUseCase(
    videoRepository as never,
    eligibilityService as never,
    videoCacheInvalidator as never,
    cacheService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('increments view count and invalidates caches for new event', async () => {
    cacheService.setIfNotExists.mockResolvedValue(true);
    videoRepository.findBasicById.mockResolvedValue({ channelId: 'channel-1' });
    videoRepository.incrementViewCount.mockResolvedValue(undefined);
    videoCacheInvalidator.invalidateMetadata.mockResolvedValue(undefined);
    videoCacheInvalidator.invalidateDiscoveryLists.mockResolvedValue(undefined);
    eligibilityService.syncChannelEligibility.mockResolvedValue(undefined);

    await useCase.execute({
      eventId: 'event-1',
      data: {
        videoId: 'video-1',
        userId: 'user-1',
      },
    });

    expect(videoRepository.incrementViewCount).toHaveBeenCalledWith('video-1');
    expect(videoCacheInvalidator.invalidateMetadata).toHaveBeenCalledWith(
      'video-1',
    );
    expect(
      videoCacheInvalidator.invalidateDiscoveryLists,
    ).toHaveBeenCalledTimes(1);
    expect(eligibilityService.syncChannelEligibility).toHaveBeenCalledWith(
      'channel-1',
    );
  });

  it('skips duplicate events', async () => {
    cacheService.setIfNotExists.mockResolvedValue(false);

    await useCase.execute({
      eventId: 'event-1',
      data: {
        videoId: 'video-1',
        userId: 'user-1',
      },
    });

    expect(videoRepository.incrementViewCount).not.toHaveBeenCalled();
    expect(videoCacheInvalidator.invalidateMetadata).not.toHaveBeenCalled();
    expect(
      videoCacheInvalidator.invalidateDiscoveryLists,
    ).not.toHaveBeenCalled();
    expect(eligibilityService.syncChannelEligibility).not.toHaveBeenCalled();
  });

  it('skips recalculation when the video does not exist', async () => {
    cacheService.setIfNotExists.mockResolvedValue(true);
    videoRepository.findBasicById.mockResolvedValue(null);

    await useCase.execute({
      eventId: 'event-2',
      data: {
        videoId: 'missing-video',
        userId: 'user-1',
      },
    });

    expect(videoRepository.incrementViewCount).not.toHaveBeenCalled();
    expect(eligibilityService.syncChannelEligibility).not.toHaveBeenCalled();
  });
});
