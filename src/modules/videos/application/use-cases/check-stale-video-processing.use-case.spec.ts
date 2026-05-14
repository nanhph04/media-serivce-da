import {
  VideoEntity,
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { CheckStaleVideoProcessingUseCase } from './check-stale-video-processing.use-case';

describe('CheckStaleVideoProcessingUseCase', () => {
  const videoRepository = {
    findStaleByStatus: jest.fn(),
    save: jest.fn(),
  };
  const videoWorkerHealthChecker = {
    isHealthy: jest.fn(),
  };
  const healthFailureStore = {
    reset: jest.fn(),
    increment: jest.fn(),
  };
  const configService = {
    getVideoModerationTimeoutSeconds: jest.fn(),
    getVideoProcessingTimeoutSeconds: jest.fn(),
    getVideoWatchdogBatchSize: jest.fn(),
    getVideoWatchdogHealthFailureTtlSeconds: jest.fn(),
    getVideoWatchdogHealthFailureThreshold: jest.fn(),
  };
  const logger = {
    setContext: jest.fn(),
    logWarn: jest.fn(),
  };

  let useCase: CheckStaleVideoProcessingUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T01:00:00.000Z'));
    videoRepository.findStaleByStatus.mockResolvedValue([]);
    videoRepository.save.mockResolvedValue(undefined);
    videoWorkerHealthChecker.isHealthy.mockResolvedValue(true);
    healthFailureStore.reset.mockResolvedValue(undefined);
    healthFailureStore.increment.mockResolvedValue(1);
    configService.getVideoModerationTimeoutSeconds.mockReturnValue(900);
    configService.getVideoProcessingTimeoutSeconds.mockReturnValue(3600);
    configService.getVideoWatchdogBatchSize.mockReturnValue(100);
    configService.getVideoWatchdogHealthFailureTtlSeconds.mockReturnValue(300);
    configService.getVideoWatchdogHealthFailureThreshold.mockReturnValue(3);
    useCase = new CheckStaleVideoProcessingUseCase(
      videoRepository as never,
      videoWorkerHealthChecker as never,
      healthFailureStore as never,
      configService as never,
      logger as never,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('queries stale moderation and processing videos by statusChangedAt cutoff', async () => {
    await useCase.execute();

    expect(videoRepository.findStaleByStatus).toHaveBeenNthCalledWith(
      1,
      VideoStatus.PENDING_MODERATION,
      new Date('2026-01-01T00:45:00.000Z'),
      100,
    );
    expect(videoRepository.findStaleByStatus).toHaveBeenNthCalledWith(
      2,
      VideoStatus.PROCESSING,
      new Date('2026-01-01T00:00:00.000Z'),
      100,
    );
    expect(videoWorkerHealthChecker.isHealthy).not.toHaveBeenCalled();
  });

  it('resets failure counter and logs stale videos when health is ok', async () => {
    const video = buildVideo({ status: VideoStatus.PROCESSING });
    videoRepository.findStaleByStatus
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([video]);

    await useCase.execute();

    expect(videoWorkerHealthChecker.isHealthy).toHaveBeenCalledWith(
      'processing',
    );
    expect(healthFailureStore.reset).toHaveBeenCalledWith('processing');
    expect(videoRepository.save).not.toHaveBeenCalled();
    expect(logger.logWarn).toHaveBeenCalledWith(
      'Video pipeline is stale but worker is healthy',
      expect.objectContaining({
        videoId: 'video-1',
        pipeline: 'processing',
      }),
    );
  });

  it('increments health failure counter without failing below threshold', async () => {
    const video = buildVideo({ status: VideoStatus.PENDING_MODERATION });
    videoRepository.findStaleByStatus
      .mockResolvedValueOnce([video])
      .mockResolvedValueOnce([]);
    videoWorkerHealthChecker.isHealthy.mockResolvedValue(false);
    healthFailureStore.increment.mockResolvedValue(2);

    await useCase.execute();

    expect(healthFailureStore.increment).toHaveBeenCalledWith(
      'moderation',
      300,
    );
    expect(videoRepository.save).not.toHaveBeenCalled();
  });

  it('marks stale videos failed when health failure counter reaches threshold', async () => {
    const video = buildVideo({ status: VideoStatus.PROCESSING });
    videoRepository.findStaleByStatus
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([video]);
    videoWorkerHealthChecker.isHealthy.mockResolvedValue(false);
    healthFailureStore.increment.mockResolvedValue(3);

    await useCase.execute();

    expect(video.status).toBe(VideoStatus.FAILED);
    expect(video.errorMessage).toBe('Processing service unavailable');
    expect(videoRepository.save).toHaveBeenCalledWith(video);
  });
});

function buildVideo(input: { status: VideoStatus }): VideoEntity {
  return new VideoEntity({
    id: 'video-1',
    channelId: 'channel-1',
    ownerId: 'owner-1',
    title: 'Video',
    description: 'Description',
    category: [],
    visibility: VideoVisibility.PUBLIC,
    status: input.status,
    price: 0,
    requiredTierLevel: null,
    rawFileKey: 'raw/video.mp4',
    masterPlaylistKey: null,
    thumbnailUrl: null,
    durationSeconds: null,
    resolutions: [],
    errorMessage: null,
    viewCount: 0,
    publishedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    statusChangedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}
