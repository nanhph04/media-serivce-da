import {
  VideoEntity,
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { HandleVideoProcessedFailedUseCase } from './handle-video-processed-failed.use-case';

describe('HandleVideoProcessedFailedUseCase', () => {
  const videoRepository = {
    findById: jest.fn(),
    save: jest.fn(),
  };
  const idempotencyStore = {
    setIfNotExists: jest.fn(),
  };
  const logger = {
    setContext: jest.fn(),
    logWarn: jest.fn(),
  };
  const videoStatusEventPublisher = {
    publishVideoStatusChanged: jest.fn(),
  };

  let useCase: HandleVideoProcessedFailedUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    idempotencyStore.setIfNotExists.mockResolvedValue(true);
    videoRepository.save.mockResolvedValue(undefined);
    useCase = new HandleVideoProcessedFailedUseCase(
      videoRepository as never,
      idempotencyStore as never,
      videoStatusEventPublisher as never,
      logger as never,
    );
  });

  it('marks processing video as failed', async () => {
    const video = buildVideo({ status: VideoStatus.PROCESSING });
    videoRepository.findById.mockResolvedValue(video);

    await useCase.execute({
      eventId: 'event-1',
      data: {
        videoId: 'video-1',
        errorMessage: 'FFmpeg failed',
      },
    });

    expect(video.status).toBe(VideoStatus.FAILED);
    expect(video.errorMessage).toBe('FFmpeg failed');
    expect(videoRepository.save).toHaveBeenCalledWith(video);
    expect(
      videoStatusEventPublisher.publishVideoStatusChanged,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        videoId: 'video-1',
        userId: 'owner-1',
        status: VideoStatus.FAILED,
        jobStatus: 'failed',
      }),
    );
  });

  it.each([
    VideoStatus.DRAFT,
    VideoStatus.PENDING_MODERATION,
    VideoStatus.READY,
    VideoStatus.FAILED,
    VideoStatus.REJECTED,
    VideoStatus.PENDING_MANUAL_REVIEW,
  ])('ignores stale failed event when current status is %s', async (status) => {
    videoRepository.findById.mockResolvedValue(buildVideo({ status }));

    await useCase.execute({
      eventId: 'event-1',
      data: {
        videoId: 'video-1',
        errorMessage: 'FFmpeg failed',
      },
    });

    expect(videoRepository.save).not.toHaveBeenCalled();
    expect(logger.logWarn).toHaveBeenCalledWith(
      'Ignoring stale video processed failed event',
      {
        eventId: 'event-1',
        videoId: 'video-1',
        currentStatus: status,
      },
    );
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
    thumbnailObjectKey: null,
    thumbnailSource: 'auto' as never,
    thumbnailStatus: 'pending' as never,
    thumbnailGeneratedAt: null,
    thumbnailError: null,
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
