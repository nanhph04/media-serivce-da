import {
  VideoEntity,
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { HandleVideoProcessedSuccessUseCase } from './handle-video-processed-success.use-case';

describe('HandleVideoProcessedSuccessUseCase', () => {
  const videoRepository = {
    findById: jest.fn(),
    save: jest.fn(),
  };
  const eligibilityService = {
    syncChannelEligibility: jest.fn(),
  };
  const cacheService = {
    setIfNotExists: jest.fn(),
  };
  const objectStorageService = {
    objectExists: jest.fn(),
    deleteObject: jest.fn(),
  };
  const logger = {
    setContext: jest.fn(),
    logWarn: jest.fn(),
  };
  const videoCacheInvalidator = {
    invalidateMetadata: jest.fn(),
    invalidateDiscoveryLists: jest.fn(),
  };

  let useCase: HandleVideoProcessedSuccessUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    cacheService.setIfNotExists.mockResolvedValue(true);
    objectStorageService.objectExists.mockResolvedValue(true);
    objectStorageService.deleteObject.mockResolvedValue(undefined);
    videoRepository.save.mockResolvedValue(undefined);
    eligibilityService.syncChannelEligibility.mockResolvedValue(undefined);
    videoCacheInvalidator.invalidateMetadata.mockResolvedValue(undefined);
    videoCacheInvalidator.invalidateDiscoveryLists.mockResolvedValue(undefined);
    useCase = new HandleVideoProcessedSuccessUseCase(
      videoRepository as never,
      eligibilityService as never,
      cacheService as never,
      objectStorageService as never,
      logger as never,
      videoCacheInvalidator as never,
    );
  });

  it('recalculates channel eligibility after video becomes ready', async () => {
    videoRepository.findById.mockResolvedValue(
      buildVideo({ status: VideoStatus.PROCESSING }),
    );

    await useCase.execute({
      eventId: 'event-1',
      data: {
        videoId: 'video-1',
        masterPlaylistKey: 'processed/master.m3u8',
        durationSeconds: 120,
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        resolution: ['1080p'],
      },
    });

    expect(videoRepository.save).toHaveBeenCalled();
    const savedVideo = videoRepository.save.mock.calls[0][0] as VideoEntity;
    expect(savedVideo.status).toBe(VideoStatus.READY);
    expect(videoCacheInvalidator.invalidateMetadata).toHaveBeenCalledWith(
      'video-1',
    );
    expect(videoCacheInvalidator.invalidateDiscoveryLists).toHaveBeenCalled();
    expect(eligibilityService.syncChannelEligibility).toHaveBeenCalledWith(
      'channel-1',
    );
    expect(objectStorageService.objectExists).toHaveBeenCalledWith(
      'raw',
      'raw/video.mp4',
    );
    expect(objectStorageService.deleteObject).toHaveBeenCalledWith(
      'raw',
      'raw/video.mp4',
    );
  });

  it('does not delete raw when the raw object is already missing', async () => {
    objectStorageService.objectExists.mockResolvedValue(false);
    videoRepository.findById.mockResolvedValue(
      buildVideo({ status: VideoStatus.PROCESSING }),
    );

    await useCase.execute({
      eventId: 'event-1',
      data: {
        videoId: 'video-1',
        masterPlaylistKey: 'processed/master.m3u8',
        durationSeconds: 120,
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        resolution: ['1080p'],
      },
    });

    expect(videoRepository.save).toHaveBeenCalled();
    expect(objectStorageService.objectExists).toHaveBeenCalledWith(
      'raw',
      'raw/video.mp4',
    );
    expect(objectStorageService.deleteObject).not.toHaveBeenCalled();
  });

  it('keeps the video ready when raw deletion fails', async () => {
    objectStorageService.deleteObject.mockRejectedValue(new Error('MinIO down'));
    videoRepository.findById.mockResolvedValue(
      buildVideo({ status: VideoStatus.PROCESSING }),
    );

    await expect(
      useCase.execute({
        eventId: 'event-1',
        data: {
          videoId: 'video-1',
          masterPlaylistKey: 'processed/master.m3u8',
          durationSeconds: 120,
          thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
          resolution: ['1080p'],
        },
      }),
    ).resolves.toBeUndefined();

    expect(videoRepository.save).toHaveBeenCalled();
    const savedVideo = videoRepository.save.mock.calls[0][0] as VideoEntity;
    expect(savedVideo.status).toBe(VideoStatus.READY);
    expect(logger.logWarn).toHaveBeenCalledWith(
      'Failed to delete processed video raw object',
      {
        videoId: 'video-1',
        rawFileKey: 'raw/video.mp4',
        error: 'MinIO down',
      },
    );
  });

  it.each([
    VideoStatus.REJECTED,
    VideoStatus.FAILED,
    VideoStatus.PENDING_MANUAL_REVIEW,
    VideoStatus.READY,
    VideoStatus.DRAFT,
    VideoStatus.PENDING_MODERATION,
  ])('ignores processed success when current status is %s', async (status) => {
    videoRepository.findById.mockResolvedValue(buildVideo({ status }));

    await useCase.execute({
      eventId: 'event-1',
      data: {
        videoId: 'video-1',
        masterPlaylistKey: 'processed/master.m3u8',
        durationSeconds: 120,
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        resolution: ['1080p'],
      },
    });

    expect(videoRepository.save).not.toHaveBeenCalled();
    expect(videoCacheInvalidator.invalidateMetadata).not.toHaveBeenCalled();
    expect(
      videoCacheInvalidator.invalidateDiscoveryLists,
    ).not.toHaveBeenCalled();
    expect(eligibilityService.syncChannelEligibility).not.toHaveBeenCalled();
    expect(objectStorageService.objectExists).not.toHaveBeenCalled();
    expect(objectStorageService.deleteObject).not.toHaveBeenCalled();
    expect(logger.logWarn).toHaveBeenCalledWith(
      'Ignoring stale video processed success event',
      {
        eventId: 'event-1',
        videoId: 'video-1',
        currentStatus: status,
      },
    );
  });

  it('skips duplicate processed success events', async () => {
    cacheService.setIfNotExists.mockResolvedValue(false);

    await useCase.execute({
      eventId: 'event-1',
      data: {
        videoId: 'video-1',
        masterPlaylistKey: 'processed/master.m3u8',
        durationSeconds: 120,
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        resolution: ['1080p'],
      },
    });

    expect(videoRepository.findById).not.toHaveBeenCalled();
    expect(videoRepository.save).not.toHaveBeenCalled();
    expect(videoCacheInvalidator.invalidateMetadata).not.toHaveBeenCalled();
    expect(
      videoCacheInvalidator.invalidateDiscoveryLists,
    ).not.toHaveBeenCalled();
    expect(objectStorageService.objectExists).not.toHaveBeenCalled();
    expect(objectStorageService.deleteObject).not.toHaveBeenCalled();
  });

  it('returns without side effects when video is missing', async () => {
    videoRepository.findById.mockResolvedValue(null);

    await useCase.execute({
      eventId: 'event-1',
      data: {
        videoId: 'video-1',
        masterPlaylistKey: 'processed/master.m3u8',
        durationSeconds: 120,
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        resolution: ['1080p'],
      },
    });

    expect(videoRepository.save).not.toHaveBeenCalled();
    expect(videoCacheInvalidator.invalidateMetadata).not.toHaveBeenCalled();
    expect(
      videoCacheInvalidator.invalidateDiscoveryLists,
    ).not.toHaveBeenCalled();
    expect(eligibilityService.syncChannelEligibility).not.toHaveBeenCalled();
    expect(objectStorageService.objectExists).not.toHaveBeenCalled();
    expect(objectStorageService.deleteObject).not.toHaveBeenCalled();
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
  });
}
