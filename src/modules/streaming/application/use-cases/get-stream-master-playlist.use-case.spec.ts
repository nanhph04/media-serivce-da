import { NotFoundException } from '@shared/domain/exceptions/domain.exception';
import { GetStreamMasterPlaylistUseCase } from './get-stream-master-playlist.use-case';
import {
  VideoEntity,
  VideoStatus,
  VideoVisibility,
} from '../../../videos/domain/entities/video.entity';

describe('GetStreamMasterPlaylistUseCase', () => {
  const playbackTokenVerifier = {
    verifyToken: jest.fn(),
  };
  const objectStorageService = {
    getObjectText: jest.fn(),
  };
  const textCache = {
    get: jest.fn(),
    set: jest.fn(),
  };
  const streamConfig = {
    getMasterPlaylistKeyCacheTtlSeconds: jest.fn(),
    getRewrittenPlaylistCacheTtlSeconds: jest.fn(),
  };
  const recordVideoViewUseCase = {
    execute: jest.fn(),
  };
  const videoRepository = {
    findBasicById: jest.fn(),
  };

  let useCase: GetStreamMasterPlaylistUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    streamConfig.getMasterPlaylistKeyCacheTtlSeconds.mockReturnValue(30);
    streamConfig.getRewrittenPlaylistCacheTtlSeconds.mockReturnValue(10);
    textCache.get.mockResolvedValue(null);
    textCache.set.mockResolvedValue(undefined);
    useCase = new GetStreamMasterPlaylistUseCase(
      playbackTokenVerifier as never,
      objectStorageService as never,
      textCache as never,
      streamConfig as never,
      videoRepository as never,
      recordVideoViewUseCase as never,
    );
  });

  it('records a view after loading the master playlist successfully', async () => {
    playbackTokenVerifier.verifyToken.mockReturnValue({
      videoId: 'video-1',
      userId: 'viewer-1',
      channelId: 'channel-1',
    });
    videoRepository.findBasicById.mockResolvedValue(buildVideo());
    objectStorageService.getObjectText.mockResolvedValue('#EXTM3U\nsegment.ts');

    await expect(
      useCase.execute({
        videoId: 'video-1',
        token: 'playback-token',
      }),
    ).resolves.toContain(
      '/api/media/stream/video-1/segments/segments%2Fsegment.ts?token=playback-token',
    );

    expect(recordVideoViewUseCase.execute).toHaveBeenCalledWith({
      userId: 'viewer-1',
      videoId: 'video-1',
    });
  });

  it('does not record a view when the master playlist is missing', async () => {
    playbackTokenVerifier.verifyToken.mockReturnValue({
      videoId: 'video-1',
      userId: 'viewer-1',
      channelId: 'channel-1',
    });
    videoRepository.findBasicById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        videoId: 'video-1',
        token: 'playback-token',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(recordVideoViewUseCase.execute).not.toHaveBeenCalled();
  });

  it('reuses cached playlist data on repeated master playlist requests', async () => {
    playbackTokenVerifier.verifyToken.mockReturnValue({
      videoId: 'video-1',
      userId: 'viewer-1',
      channelId: 'channel-1',
    });
    videoRepository.findBasicById.mockResolvedValue(buildVideo());
    objectStorageService.getObjectText.mockResolvedValue('#EXTM3U\nsegment.ts');

    await useCase.execute({
      videoId: 'video-1',
      token: 'playback-token',
    });

    textCache.get.mockImplementation(async (key: string) => {
      if (key.includes('master-playlist-key')) {
        return 'processed/master.m3u8';
      }
      if (key.includes('playlist:processed%2Fmaster.m3u8')) {
        return '#EXTM3U\n/api/media/stream/video-1/segments/segments%2Fsegment.ts?token=playback-token';
      }
      return null;
    });

    await expect(
      useCase.execute({
        videoId: 'video-1',
        token: 'playback-token',
      }),
    ).resolves.toBe(
      '#EXTM3U\n/api/media/stream/video-1/segments/segments%2Fsegment.ts?token=playback-token',
    );

    expect(videoRepository.findBasicById).toHaveBeenCalledTimes(1);
    expect(objectStorageService.getObjectText).toHaveBeenCalledTimes(1);
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
