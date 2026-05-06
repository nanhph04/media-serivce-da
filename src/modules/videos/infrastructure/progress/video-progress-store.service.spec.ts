import { VideoProgressStoreService } from './video-progress-store.service';

describe('VideoProgressStoreService', () => {
  const cacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  let service: VideoProgressStoreService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VideoProgressStoreService(cacheService as never);
  });

  it('accepts forward progress with a higher-ranked stage', async () => {
    cacheService.get.mockResolvedValue({
      videoId: 'video-1',
      stage: 'moderating',
      percent: 100,
      message: 'Moderation completed',
      terminal: false,
      updatedAt: '2026-01-01T00:00:00.000Z',
      detail: null,
      errorCode: null,
    });
    cacheService.set.mockResolvedValue(undefined);

    const result = await service.applyProgressUpdate({
      videoId: 'video-1',
      stage: 'processing',
      percent: 5,
      message: 'Queued for processing',
      terminal: false,
      updatedAt: '2026-01-02T00:00:00.000Z',
      detail: null,
      errorCode: null,
    });

    expect(result).toEqual(
      expect.objectContaining({
        stage: 'processing',
        percent: 5,
      }),
    );
    expect(cacheService.set).toHaveBeenCalled();
  });

  it('rejects regressive progress from a lower-ranked stage', async () => {
    cacheService.get.mockResolvedValue({
      videoId: 'video-1',
      stage: 'processing',
      percent: 5,
      message: 'Queued for processing',
      terminal: false,
      updatedAt: '2026-01-02T00:00:00.000Z',
      detail: null,
      errorCode: null,
    });

    const result = await service.applyProgressUpdate({
      videoId: 'video-1',
      stage: 'moderating',
      percent: 100,
      message: 'Moderation completed',
      terminal: false,
      updatedAt: '2026-01-03T00:00:00.000Z',
      detail: null,
      errorCode: null,
    });

    expect(result).toBeNull();
    expect(cacheService.set).not.toHaveBeenCalled();
  });

  it('rejects percent regression within the same stage', async () => {
    cacheService.get.mockResolvedValue({
      videoId: 'video-1',
      stage: 'processing',
      percent: 20,
      message: 'Processing',
      terminal: false,
      updatedAt: '2026-01-02T00:00:00.000Z',
      detail: null,
      errorCode: null,
    });

    const result = await service.applyProgressUpdate({
      videoId: 'video-1',
      stage: 'processing',
      percent: 10,
      message: 'Processing',
      terminal: false,
      updatedAt: '2026-01-03T00:00:00.000Z',
      detail: null,
      errorCode: null,
    });

    expect(result).toBeNull();
  });

  it('rejects non-terminal updates after a terminal snapshot', async () => {
    cacheService.get.mockResolvedValue({
      videoId: 'video-1',
      stage: 'ready',
      percent: 100,
      message: 'Completed',
      terminal: true,
      updatedAt: '2026-01-02T00:00:00.000Z',
      detail: null,
      errorCode: null,
    });

    const result = await service.applyProgressUpdate({
      videoId: 'video-1',
      stage: 'processing',
      percent: 100,
      message: 'Completed processing',
      terminal: false,
      updatedAt: '2026-01-03T00:00:00.000Z',
      detail: null,
      errorCode: null,
    });

    expect(result).toBeNull();
  });
});
