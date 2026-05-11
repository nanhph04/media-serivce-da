import { FlushPendingVideoViewsUseCase } from './flush-pending-video-views.use-case';

describe('FlushPendingVideoViewsUseCase', () => {
  const videoViewAggregation = {
    getDirtyVideoIds: jest.fn(),
    claimPendingViewDelta: jest.fn(),
    completeFlush: jest.fn(),
    restoreInflightViewDelta: jest.fn(),
  };
  const videoRepository = {
    incrementViewCountBy: jest.fn(),
  };
  const videoCacheInvalidator = {
    invalidateMetadata: jest.fn(),
  };
  const logger = {
    setContext: jest.fn(),
    logError: jest.fn(),
  };

  const useCase = new FlushPendingVideoViewsUseCase(
    videoViewAggregation as never,
    videoRepository as never,
    videoCacheInvalidator as never,
    logger as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('flushes pending view deltas into the database once per dirty video', async () => {
    videoViewAggregation.getDirtyVideoIds.mockResolvedValue(['video-1']);
    videoViewAggregation.claimPendingViewDelta.mockResolvedValue(12);
    videoRepository.incrementViewCountBy.mockResolvedValue(undefined);
    videoCacheInvalidator.invalidateMetadata.mockResolvedValue(undefined);
    videoViewAggregation.completeFlush.mockResolvedValue(undefined);

    await useCase.execute();

    expect(videoRepository.incrementViewCountBy).toHaveBeenCalledWith(
      'video-1',
      12,
    );
    expect(videoCacheInvalidator.invalidateMetadata).toHaveBeenCalledWith(
      'video-1',
    );
    expect(videoViewAggregation.completeFlush).toHaveBeenCalledWith('video-1');
  });

  it('restores the inflight delta when the database update fails', async () => {
    videoViewAggregation.getDirtyVideoIds.mockResolvedValue(['video-1']);
    videoViewAggregation.claimPendingViewDelta.mockResolvedValue(4);
    videoRepository.incrementViewCountBy.mockRejectedValue(
      new Error('DB down'),
    );
    videoViewAggregation.restoreInflightViewDelta.mockResolvedValue(undefined);

    await useCase.execute();

    expect(videoViewAggregation.restoreInflightViewDelta).toHaveBeenCalledWith(
      'video-1',
    );
    expect(videoViewAggregation.completeFlush).not.toHaveBeenCalled();
  });
});
