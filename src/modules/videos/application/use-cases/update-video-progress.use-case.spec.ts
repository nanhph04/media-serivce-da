import { NotFoundException } from '@shared/domain/exceptions/domain.exception';
import { RecordVideoViewUseCase } from '../../../engagement/application/use-cases/record-video-view.use-case';
import { UpdateVideoProgressUseCase } from './update-video-progress.use-case';
import { VideoEntity, VideoStatus, VideoVisibility } from '../../domain/entities/video.entity';
import { VideoWatchProgressEntity } from '../../domain/entities/video-watch-progress.entity';

describe('UpdateVideoProgressUseCase', () => {
  const videoRepository = {
    findBasicById: jest.fn(),
  };
  const watchProgressRepository = {
    findByUserIdAndVideoId: jest.fn(),
    save: jest.fn(),
  };
  const videoWatchAccessService = {
    assertCanWatch: jest.fn(),
  };
  const recordVideoViewUseCase = {
    execute: jest.fn(),
  };
  const videoViewConfig = {
    getVideoViewMinSeconds: jest.fn(),
    getVideoViewMinPercent: jest.fn(),
  };

  const useCase = new UpdateVideoProgressUseCase(
    videoRepository as never,
    watchProgressRepository as never,
    videoWatchAccessService as never,
    recordVideoViewUseCase as never as RecordVideoViewUseCase,
    videoViewConfig as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    recordVideoViewUseCase.execute.mockResolvedValue(undefined);
    videoViewConfig.getVideoViewMinSeconds.mockReturnValue(10);
    videoViewConfig.getVideoViewMinPercent.mockReturnValue(20);
  });

  it('creates a new progress record when one does not exist', async () => {
    videoRepository.findBasicById.mockResolvedValue(buildVideo());
    watchProgressRepository.findByUserIdAndVideoId.mockResolvedValue(null);
    watchProgressRepository.save.mockResolvedValue(undefined);
    videoWatchAccessService.assertCanWatch.mockResolvedValue(undefined);

    await expect(
      useCase.execute({
        userId: 'viewer-1',
        videoId: 'video-1',
        positionSeconds: 25,
        durationSeconds: 120,
        state: 'watching',
      }),
    ).resolves.toEqual({
      videoId: 'video-1',
      positionSeconds: 25,
      completed: false,
    });

    expect(watchProgressRepository.save).toHaveBeenCalledTimes(1);
    expect(recordVideoViewUseCase.execute).toHaveBeenCalledWith({
      userId: 'viewer-1',
      videoId: 'video-1',
    });
  });

  it('marks progress as completed when remaining time is below threshold', async () => {
    videoRepository.findBasicById.mockResolvedValue(buildVideo());
    watchProgressRepository.findByUserIdAndVideoId.mockResolvedValue(
      buildProgress({
        lastPositionSeconds: 60,
        durationSeconds: 120,
        completedAt: null,
      }),
    );
    watchProgressRepository.save.mockResolvedValue(undefined);
    videoWatchAccessService.assertCanWatch.mockResolvedValue(undefined);

    await expect(
      useCase.execute({
        userId: 'viewer-1',
        videoId: 'video-1',
        positionSeconds: 95,
        durationSeconds: 120,
        state: 'paused',
      }),
    ).resolves.toEqual({
      videoId: 'video-1',
      positionSeconds: 95,
      completed: true,
    });

    expect(recordVideoViewUseCase.execute).toHaveBeenCalledWith({
      userId: 'viewer-1',
      videoId: 'video-1',
    });
  });

  it('ignores stale regression updates that move position too far back', async () => {
    const progress = buildProgress({
      lastPositionSeconds: 90,
      durationSeconds: 120,
      completedAt: null,
    });
    videoRepository.findBasicById.mockResolvedValue(buildVideo());
    watchProgressRepository.findByUserIdAndVideoId.mockResolvedValue(progress);
    videoWatchAccessService.assertCanWatch.mockResolvedValue(undefined);

    await expect(
      useCase.execute({
        userId: 'viewer-1',
        videoId: 'video-1',
        positionSeconds: 70,
        durationSeconds: 120,
        state: 'watching',
      }),
    ).resolves.toEqual({
      videoId: 'video-1',
      positionSeconds: 90,
      completed: false,
    });

    expect(watchProgressRepository.save).not.toHaveBeenCalled();
    expect(recordVideoViewUseCase.execute).not.toHaveBeenCalled();
  });

  it('does not record a view before the threshold is reached', async () => {
    videoRepository.findBasicById.mockResolvedValue(buildVideo());
    watchProgressRepository.findByUserIdAndVideoId.mockResolvedValue(null);
    watchProgressRepository.save.mockResolvedValue(undefined);
    videoWatchAccessService.assertCanWatch.mockResolvedValue(undefined);

    await useCase.execute({
      userId: 'viewer-1',
      videoId: 'video-1',
      positionSeconds: 5,
      durationSeconds: 120,
      state: 'watching',
    });

    expect(recordVideoViewUseCase.execute).not.toHaveBeenCalled();
  });

  it('does not fail progress persistence when view recording fails', async () => {
    videoRepository.findBasicById.mockResolvedValue(buildVideo());
    watchProgressRepository.findByUserIdAndVideoId.mockResolvedValue(null);
    watchProgressRepository.save.mockResolvedValue(undefined);
    videoWatchAccessService.assertCanWatch.mockResolvedValue(undefined);
    recordVideoViewUseCase.execute.mockRejectedValue(new Error('Kafka down'));

    await expect(
      useCase.execute({
        userId: 'viewer-1',
        videoId: 'video-1',
        positionSeconds: 25,
        durationSeconds: 120,
        state: 'watching',
      }),
    ).resolves.toEqual({
      videoId: 'video-1',
      positionSeconds: 25,
      completed: false,
    });

    expect(watchProgressRepository.save).toHaveBeenCalledTimes(1);
  });

  it('throws not found when video does not exist', async () => {
    videoRepository.findBasicById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'viewer-1',
        videoId: 'missing-video',
        positionSeconds: 10,
      }),
    ).rejects.toThrow(NotFoundException);
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
    status: VideoStatus.READY,
    price: 0,
    requiredTierLevel: null,
    rawFileKey: 'raw/video.mp4',
    masterPlaylistKey: 'processed/master.m3u8',
    thumbnailUrl: null,
    durationSeconds: 120,
    resolutions: ['720p'],
    errorMessage: null,
    viewCount: 0,
    publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

function buildProgress(
  overrides: Partial<ConstructorParameters<typeof VideoWatchProgressEntity>[0]>,
): VideoWatchProgressEntity {
  return new VideoWatchProgressEntity({
    id: 'progress-1',
    userId: 'viewer-1',
    videoId: 'video-1',
    channelId: 'channel-1',
    lastPositionSeconds: 25,
    durationSeconds: 120,
    lastWatchedAt: new Date('2026-01-01T00:00:00.000Z'),
    completedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}
