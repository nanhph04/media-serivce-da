import { PlaybackTokenService } from '@shared/infrastructure/security/playback-token.service';
import { PlayVideoUseCase } from './play-video.use-case';
import {
  VideoEntity,
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { NotFoundException } from '@shared/domain/exceptions/domain.exception';

describe('PlayVideoUseCase', () => {
  const videoRepository = {
    findBasicById: jest.fn(),
  };
  const watchProgressRepository = {
    findByUserIdAndVideoId: jest.fn(),
  };
  const videoWatchAccessService = {
    assertCanWatch: jest.fn(),
  };
  const playbackTokenService = {
    issueToken: jest.fn(),
  };

  const useCase = new PlayVideoUseCase(
    videoRepository as never,
    watchProgressRepository as never,
    videoWatchAccessService as never,
    playbackTokenService as PlaybackTokenService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns playback token and url after access succeeds', async () => {
    const video = buildVideo();
    videoRepository.findBasicById.mockResolvedValue(video);
    watchProgressRepository.findByUserIdAndVideoId.mockResolvedValue(null);
    videoWatchAccessService.assertCanWatch.mockResolvedValue(undefined);
    playbackTokenService.issueToken.mockReturnValue('playback-token');

    await expect(
      useCase.execute({
        videoId: 'video-1',
        userId: 'viewer-1',
      }),
    ).resolves.toEqual({
      videoId: 'video-1',
      title: 'Video',
      description: 'Description',
      playbackToken: 'playback-token',
      playbackUrl: '/api/media/stream/video-1/master.m3u8?token=playback-token',
      resumePositionSeconds: 0,
      isResumeAvailable: false,
    });

    expect(videoWatchAccessService.assertCanWatch).toHaveBeenCalledWith(
      video,
      'viewer-1',
    );
  });

  it('throws not found when video does not exist', async () => {
    videoRepository.findBasicById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        videoId: 'missing-video',
        userId: 'viewer-1',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns resume position when unfinished progress exists', async () => {
    const video = buildVideo();
    videoRepository.findBasicById.mockResolvedValue(video);
    watchProgressRepository.findByUserIdAndVideoId.mockResolvedValue({
      lastPositionSeconds: 42,
      isCompleted: (): boolean => false,
    });
    videoWatchAccessService.assertCanWatch.mockResolvedValue(undefined);
    playbackTokenService.issueToken.mockReturnValue('playback-token');

    await expect(
      useCase.execute({
        videoId: 'video-1',
        userId: 'viewer-1',
      }),
    ).resolves.toMatchObject({
      resumePositionSeconds: 42,
      isResumeAvailable: true,
    });
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
