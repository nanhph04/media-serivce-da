import {
  VideoEntity,
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { HandleVideoModerationCompletedUseCase } from './handle-video-moderation-completed.use-case';

describe('HandleVideoModerationCompletedUseCase', () => {
  const videoRepository = {
    findById: jest.fn(),
    save: jest.fn(),
  };
  const videoProcessingJobDispatcher = {
    enqueueTranscodeJob: jest.fn(),
  };
  const idempotencyStore = {
    exists: jest.fn(),
    setIfNotExists: jest.fn(),
    delete: jest.fn(),
  };
  const moderationOutcomePublisher = {
    publishModerationOutcome: jest.fn(),
  };
  const logger = {
    setContext: jest.fn(),
    logInfo: jest.fn(),
    logWarn: jest.fn(),
  };
  const videoProgressService = {
    applyProgressUpdate: jest.fn(),
    createSnapshot: jest.fn().mockImplementation((input) => input),
  };

  let useCase: HandleVideoModerationCompletedUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    idempotencyStore.exists.mockResolvedValue(false);
    idempotencyStore.setIfNotExists.mockResolvedValue(true);
    idempotencyStore.delete.mockResolvedValue(undefined);
    videoRepository.save.mockResolvedValue(undefined);
    videoProcessingJobDispatcher.enqueueTranscodeJob.mockResolvedValue(
      undefined,
    );
    moderationOutcomePublisher.publishModerationOutcome.mockResolvedValue(
      undefined,
    );
    videoProgressService.applyProgressUpdate.mockResolvedValue(undefined);
    useCase = new HandleVideoModerationCompletedUseCase(
      videoRepository as never,
      videoProcessingJobDispatcher as never,
      moderationOutcomePublisher as never,
      idempotencyStore as never,
      logger as never,
      videoProgressService as never,
    );
  });

  it('marks safe moderated video as processing and enqueues transcode job', async () => {
    videoRepository.findById.mockResolvedValue(buildVideo());

    await useCase.execute({
      eventId: 'event-1',
      data: {
        videoId: 'video-1',
        status: 'SAFE',
        isSafe: true,
        reason: 'safe',
        confidence: 0.1,
        evidenceTimestampSeconds: null,
        rawFileKey: 'uploads/raw/channel-1/video.mp4',
        resolutions: ['480p', '720p'],
        userId: 'owner-1',
      },
    });

    const savedVideo = videoRepository.save.mock.calls[0][0] as VideoEntity;
    expect(savedVideo.status).toBe(VideoStatus.PROCESSING);
    expect(
      videoProcessingJobDispatcher.enqueueTranscodeJob,
    ).toHaveBeenCalledWith({
      videoId: 'video-1',
      rawFileKey: 'uploads/raw/channel-1/video.mp4',
      resolution: ['480p', '720p'],
      userId: 'owner-1',
    });
    expect(
      moderationOutcomePublisher.publishModerationOutcome,
    ).toHaveBeenCalledWith({
      videoId: 'video-1',
      moderationStatus: 'SAFE',
      videoStatus: VideoStatus.PROCESSING,
      outcome: 'QUEUED_FOR_PROCESSING',
      reason: 'safe',
      confidence: 0.1,
      evidenceTimestampSeconds: null,
      transcodeQueued: true,
    });
    expect(videoProgressService.applyProgressUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: 'processing',
        percent: 5,
      }),
    );
    expect(idempotencyStore.setIfNotExists).toHaveBeenNthCalledWith(
      1,
      'media:event:processing:event-1',
      '1',
      300,
    );
    expect(idempotencyStore.setIfNotExists).toHaveBeenNthCalledWith(
      2,
      'media:event:processed:event-1',
      '1',
      60 * 60 * 24,
    );
    expect(idempotencyStore.delete).toHaveBeenCalledWith(
      'media:event:processing:event-1',
    );
    expect(
      videoProgressService.applyProgressUpdate.mock.invocationCallOrder[0],
    ).toBeLessThan(idempotencyStore.setIfNotExists.mock.invocationCallOrder[1]);
  });

  it('marks yellow moderation result as pending manual review without transcoding', async () => {
    videoRepository.findById.mockResolvedValue(buildVideo());

    await useCase.execute({
      eventId: 'event-1',
      data: {
        videoId: 'video-1',
        status: 'PENDING_MANUAL_REVIEW',
        isSafe: false,
        reason: 'NSFW score 0.72 at 00:12',
        confidence: 0.72,
        evidenceTimestampSeconds: 12,
        rawFileKey: 'uploads/raw/channel-1/video.mp4',
        resolutions: ['720p'],
        userId: 'owner-1',
      },
    });

    const savedVideo = videoRepository.save.mock.calls[0][0] as VideoEntity;
    expect(savedVideo.status).toBe(VideoStatus.PENDING_MANUAL_REVIEW);
    expect(savedVideo.errorMessage).toBe('NSFW score 0.72 at 00:12');
    expect(
      videoProcessingJobDispatcher.enqueueTranscodeJob,
    ).not.toHaveBeenCalled();
    expect(
      moderationOutcomePublisher.publishModerationOutcome,
    ).toHaveBeenCalledWith({
      videoId: 'video-1',
      moderationStatus: 'PENDING_MANUAL_REVIEW',
      videoStatus: VideoStatus.PENDING_MANUAL_REVIEW,
      outcome: 'PENDING_MANUAL_REVIEW',
      reason: 'NSFW score 0.72 at 00:12',
      confidence: 0.72,
      evidenceTimestampSeconds: 12,
      transcodeQueued: false,
    });
    expect(videoProgressService.applyProgressUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: 'pending_manual_review',
        terminal: true,
      }),
    );
  });

  it('marks rejected moderation result as rejected without transcoding', async () => {
    videoRepository.findById.mockResolvedValue(buildVideo());

    await useCase.execute({
      eventId: 'event-1',
      data: {
        videoId: 'video-1',
        status: 'REJECTED',
        isSafe: false,
        reason: 'NSFW detected at 00:45',
        confidence: 0.95,
        evidenceTimestampSeconds: 45,
        rawFileKey: 'uploads/raw/channel-1/video.mp4',
        resolutions: ['720p'],
        userId: 'owner-1',
      },
    });

    const savedVideo = videoRepository.save.mock.calls[0][0] as VideoEntity;
    expect(savedVideo.status).toBe(VideoStatus.REJECTED);
    expect(savedVideo.errorMessage).toBe('NSFW detected at 00:45');
    expect(
      videoProcessingJobDispatcher.enqueueTranscodeJob,
    ).not.toHaveBeenCalled();
    expect(
      moderationOutcomePublisher.publishModerationOutcome,
    ).toHaveBeenCalledWith({
      videoId: 'video-1',
      moderationStatus: 'REJECTED',
      videoStatus: VideoStatus.REJECTED,
      outcome: 'REJECTED',
      reason: 'NSFW detected at 00:45',
      confidence: 0.95,
      evidenceTimestampSeconds: 45,
      transcodeQueued: false,
    });
    expect(videoProgressService.applyProgressUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: 'rejected',
        terminal: true,
      }),
    );
  });

  it('marks technical moderation errors as failed without transcoding', async () => {
    videoRepository.findById.mockResolvedValue(buildVideo());

    await useCase.execute({
      eventId: 'event-1',
      data: {
        videoId: 'video-1',
        status: 'ERROR',
        isSafe: false,
        reason: 'MinIO download failed',
        confidence: 0,
        evidenceTimestampSeconds: null,
        rawFileKey: 'uploads/raw/channel-1/video.mp4',
        resolutions: ['720p'],
        userId: 'owner-1',
      },
    });

    const savedVideo = videoRepository.save.mock.calls[0][0] as VideoEntity;
    expect(savedVideo.status).toBe(VideoStatus.FAILED);
    expect(savedVideo.errorMessage).toBe('MinIO download failed');
    expect(
      videoProcessingJobDispatcher.enqueueTranscodeJob,
    ).not.toHaveBeenCalled();
    expect(
      moderationOutcomePublisher.publishModerationOutcome,
    ).toHaveBeenCalledWith({
      videoId: 'video-1',
      moderationStatus: 'ERROR',
      videoStatus: VideoStatus.FAILED,
      outcome: 'FAILED',
      reason: 'MinIO download failed',
      confidence: 0,
      evidenceTimestampSeconds: null,
      transcodeQueued: false,
    });
    expect(videoProgressService.applyProgressUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: 'failed',
        terminal: true,
      }),
    );
  });

  it('skips duplicate moderation events', async () => {
    idempotencyStore.exists.mockResolvedValue(true);

    await useCase.execute({
      eventId: 'event-1',
      data: {
        videoId: 'video-1',
        status: 'SAFE',
        isSafe: true,
        reason: 'safe',
        confidence: 0.1,
        evidenceTimestampSeconds: null,
        rawFileKey: 'uploads/raw/channel-1/video.mp4',
        resolutions: ['720p'],
        userId: 'owner-1',
      },
    });

    expect(videoRepository.findById).not.toHaveBeenCalled();
    expect(
      videoProcessingJobDispatcher.enqueueTranscodeJob,
    ).not.toHaveBeenCalled();
    expect(
      moderationOutcomePublisher.publishModerationOutcome,
    ).not.toHaveBeenCalled();
    expect(idempotencyStore.setIfNotExists).not.toHaveBeenCalled();
  });

  it('skips events that are already being processed', async () => {
    idempotencyStore.setIfNotExists.mockResolvedValue(false);

    await useCase.execute({
      eventId: 'event-1',
      data: {
        videoId: 'video-1',
        status: 'SAFE',
        isSafe: true,
        reason: 'safe',
        confidence: 0.1,
        evidenceTimestampSeconds: null,
        rawFileKey: 'uploads/raw/channel-1/video.mp4',
        resolutions: ['720p'],
        userId: 'owner-1',
      },
    });

    expect(videoRepository.findById).not.toHaveBeenCalled();
    expect(
      videoProcessingJobDispatcher.enqueueTranscodeJob,
    ).not.toHaveBeenCalled();
    expect(
      moderationOutcomePublisher.publishModerationOutcome,
    ).not.toHaveBeenCalled();
    expect(idempotencyStore.delete).not.toHaveBeenCalled();
  });

  it.each([
    VideoStatus.PROCESSING,
    VideoStatus.READY,
    VideoStatus.FAILED,
    VideoStatus.REJECTED,
    VideoStatus.PENDING_MANUAL_REVIEW,
    VideoStatus.DRAFT,
  ])(
    'ignores moderation completed when current status is %s',
    async (status) => {
      videoRepository.findById.mockResolvedValue(buildVideo({ status }));

      await useCase.execute({
        eventId: 'event-1',
        data: {
          videoId: 'video-1',
          status: 'SAFE',
          isSafe: true,
          reason: 'safe',
          confidence: 0.1,
          evidenceTimestampSeconds: null,
          rawFileKey: 'uploads/raw/channel-1/video.mp4',
          resolutions: ['720p'],
          userId: 'owner-1',
        },
      });

      expect(videoRepository.save).not.toHaveBeenCalled();
      expect(
        videoProcessingJobDispatcher.enqueueTranscodeJob,
      ).not.toHaveBeenCalled();
      expect(
        moderationOutcomePublisher.publishModerationOutcome,
      ).not.toHaveBeenCalled();
      expect(videoProgressService.applyProgressUpdate).not.toHaveBeenCalled();
      expect(logger.logWarn).toHaveBeenCalledWith(
        'Ignoring stale video moderation completed event',
        {
          eventId: 'event-1',
          videoId: 'video-1',
          currentStatus: status,
        },
      );
    },
  );

  it.each([
    {
      name: 'enqueue failure',
      fail: () => {
        videoProcessingJobDispatcher.enqueueTranscodeJob.mockRejectedValueOnce(
          new Error('queue down'),
        );
      },
    },
    {
      name: 'outcome publish failure',
      fail: () => {
        moderationOutcomePublisher.publishModerationOutcome.mockRejectedValueOnce(
          new Error('kafka down'),
        );
      },
    },
    {
      name: 'progress update failure',
      fail: () => {
        videoProgressService.applyProgressUpdate.mockRejectedValueOnce(
          new Error('redis down'),
        );
      },
    },
  ])(
    'releases processing lock and does not mark processed on $name',
    async ({ fail }) => {
      videoRepository.findById.mockResolvedValue(buildVideo());
      fail();

      await expect(
        useCase.execute({
          eventId: 'event-1',
          data: {
            videoId: 'video-1',
            status: 'SAFE',
            isSafe: true,
            reason: 'safe',
            confidence: 0.1,
            evidenceTimestampSeconds: null,
            rawFileKey: 'uploads/raw/channel-1/video.mp4',
            resolutions: ['720p'],
            userId: 'owner-1',
          },
        }),
      ).rejects.toThrow();

      expect(idempotencyStore.setIfNotExists).toHaveBeenCalledTimes(1);
      expect(idempotencyStore.setIfNotExists).toHaveBeenCalledWith(
        'media:event:processing:event-1',
        '1',
        300,
      );
      expect(idempotencyStore.delete).toHaveBeenCalledWith(
        'media:event:processing:event-1',
      );
    },
  );

  it('keeps processing lock when processed marker cannot be written', async () => {
    videoRepository.findById.mockResolvedValue(buildVideo());
    idempotencyStore.setIfNotExists
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(new Error('redis down'));

    await expect(
      useCase.execute({
        eventId: 'event-1',
        data: {
          videoId: 'video-1',
          status: 'SAFE',
          isSafe: true,
          reason: 'safe',
          confidence: 0.1,
          evidenceTimestampSeconds: null,
          rawFileKey: 'uploads/raw/channel-1/video.mp4',
          resolutions: ['720p'],
          userId: 'owner-1',
        },
      }),
    ).rejects.toThrow('redis down');

    expect(videoProcessingJobDispatcher.enqueueTranscodeJob).toHaveBeenCalled();
    expect(
      moderationOutcomePublisher.publishModerationOutcome,
    ).toHaveBeenCalled();
    expect(videoProgressService.applyProgressUpdate).toHaveBeenCalled();
    expect(idempotencyStore.delete).not.toHaveBeenCalled();
  });
});

function buildVideo(
  overrides: Partial<ConstructorParameters<typeof VideoEntity>[0]> = {},
): VideoEntity {
  return new VideoEntity({
    id: 'video-1',
    channelId: 'channel-1',
    ownerId: 'owner-1',
    title: 'Video',
    description: 'Description',
    category: [],
    visibility: VideoVisibility.PUBLIC,
    status: VideoStatus.PENDING_MODERATION,
    price: 0,
    requiredTierLevel: null,
    rawFileKey: 'uploads/raw/channel-1/video.mp4',
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
    ...overrides,
  });
}
