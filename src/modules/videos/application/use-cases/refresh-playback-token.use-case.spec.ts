import { PlaybackTokenService } from '@shared/infrastructure/security/playback-token.service';
import {
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import { RefreshPlaybackTokenUseCase } from './refresh-playback-token.use-case';
import {
  VideoEntity,
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';

describe('RefreshPlaybackTokenUseCase', () => {
  const videoRepository = {
    findBasicById: jest.fn(),
  };
  const videoWatchAccessService = {
    assertCanWatch: jest.fn(),
  };
  const playbackTokenService = {
    issueToken: jest.fn(),
  };

  const useCase = new RefreshPlaybackTokenUseCase(
    videoRepository as never,
    videoWatchAccessService as never,
    playbackTokenService as PlaybackTokenService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a refreshed playback token and url after access succeeds', async () => {
    const video = buildVideo();
    videoRepository.findBasicById.mockResolvedValue(video);
    videoWatchAccessService.assertCanWatch.mockResolvedValue(undefined);
    playbackTokenService.issueToken.mockReturnValue('refreshed-token');

    const response = await useCase.execute({
      videoId: 'video-1',
      userId: 'viewer-1',
    });

    expect(response).toEqual({
      videoId: 'video-1',
      playbackToken: 'refreshed-token',
      playbackUrl:
        '/api/media/stream/video-1/master.m3u8?token=refreshed-token',
    });
    expect(response).not.toHaveProperty('title');
    expect(response).not.toHaveProperty('description');
    expect(videoWatchAccessService.assertCanWatch).toHaveBeenCalledWith(
      video,
      'viewer-1',
    );
    expect(playbackTokenService.issueToken).toHaveBeenCalledWith({
      videoId: 'video-1',
      userId: 'viewer-1',
      channelId: 'channel-1',
    });
  });

  it('throws not found when video does not exist', async () => {
    videoRepository.findBasicById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        videoId: 'missing-video',
        userId: 'viewer-1',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(videoWatchAccessService.assertCanWatch).not.toHaveBeenCalled();
    expect(playbackTokenService.issueToken).not.toHaveBeenCalled();
  });

  it('does not issue a token when access validation fails', async () => {
    const video = buildVideo();
    videoRepository.findBasicById.mockResolvedValue(video);
    videoWatchAccessService.assertCanWatch.mockRejectedValue(
      new ForbiddenException('You do not have permission to watch this video'),
    );

    await expect(
      useCase.execute({
        videoId: 'video-1',
        userId: 'viewer-1',
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(playbackTokenService.issueToken).not.toHaveBeenCalled();
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
