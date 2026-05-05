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
    setIfNotExists: jest.fn(),
  };
  const moderationOutcomePublisher = {
    publishModerationOutcome: jest.fn(),
  };
  const logger = {
    setContext: jest.fn(),
    logInfo: jest.fn(),
  };

  let useCase: HandleVideoModerationCompletedUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    idempotencyStore.setIfNotExists.mockResolvedValue(true);
    useCase = new HandleVideoModerationCompletedUseCase(
      videoRepository as never,
      videoProcessingJobDispatcher as never,
      moderationOutcomePublisher as never,
      idempotencyStore as never,
      logger as never,
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
    expect(videoProcessingJobDispatcher.enqueueTranscodeJob).toHaveBeenCalledWith({
      videoId: 'video-1',
      rawFileKey: 'uploads/raw/channel-1/video.mp4',
      resolution: ['480p', '720p'],
      userId: 'owner-1',
    });
    expect(moderationOutcomePublisher.publishModerationOutcome).toHaveBeenCalledWith({
      videoId: 'video-1',
      moderationStatus: 'SAFE',
      videoStatus: VideoStatus.PROCESSING,
      outcome: 'QUEUED_FOR_PROCESSING',
      reason: 'safe',
      confidence: 0.1,
      evidenceTimestampSeconds: null,
      transcodeQueued: true,
    });
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
    expect(videoProcessingJobDispatcher.enqueueTranscodeJob).not.toHaveBeenCalled();
    expect(moderationOutcomePublisher.publishModerationOutcome).toHaveBeenCalledWith({
      videoId: 'video-1',
      moderationStatus: 'PENDING_MANUAL_REVIEW',
      videoStatus: VideoStatus.PENDING_MANUAL_REVIEW,
      outcome: 'PENDING_MANUAL_REVIEW',
      reason: 'NSFW score 0.72 at 00:12',
      confidence: 0.72,
      evidenceTimestampSeconds: 12,
      transcodeQueued: false,
    });
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
    expect(videoProcessingJobDispatcher.enqueueTranscodeJob).not.toHaveBeenCalled();
    expect(moderationOutcomePublisher.publishModerationOutcome).toHaveBeenCalledWith({
      videoId: 'video-1',
      moderationStatus: 'REJECTED',
      videoStatus: VideoStatus.REJECTED,
      outcome: 'REJECTED',
      reason: 'NSFW detected at 00:45',
      confidence: 0.95,
      evidenceTimestampSeconds: 45,
      transcodeQueued: false,
    });
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
    expect(videoProcessingJobDispatcher.enqueueTranscodeJob).not.toHaveBeenCalled();
    expect(moderationOutcomePublisher.publishModerationOutcome).toHaveBeenCalledWith({
      videoId: 'video-1',
      moderationStatus: 'ERROR',
      videoStatus: VideoStatus.FAILED,
      outcome: 'FAILED',
      reason: 'MinIO download failed',
      confidence: 0,
      evidenceTimestampSeconds: null,
      transcodeQueued: false,
    });
  });

  it('skips duplicate moderation events', async () => {
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
    expect(videoProcessingJobDispatcher.enqueueTranscodeJob).not.toHaveBeenCalled();
    expect(moderationOutcomePublisher.publishModerationOutcome).not.toHaveBeenCalled();
  });
});

function buildVideo(): VideoEntity {
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
  });
}
