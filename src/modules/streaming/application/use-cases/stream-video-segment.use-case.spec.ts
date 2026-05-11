import { PassThrough } from 'stream';
import { StreamVideoSegmentUseCase } from './stream-video-segment.use-case';
import {
  VideoEntity,
  VideoStatus,
  VideoVisibility,
} from '../../../videos/domain/entities/video.entity';

describe('StreamVideoSegmentUseCase', () => {
  const playbackTokenVerifier = {
    verifyToken: jest.fn(),
  };
  const objectStorageService = {
    getObjectText: jest.fn(),
    getObjectStream: jest.fn(),
  };
  const textCache = {
    get: jest.fn(),
    set: jest.fn(),
  };
  const streamConfig = {
    getMasterPlaylistKeyCacheTtlSeconds: jest.fn(),
    getRewrittenPlaylistCacheTtlSeconds: jest.fn(),
  };
  const videoRepository = {
    findBasicById: jest.fn(),
  };

  let useCase: StreamVideoSegmentUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    streamConfig.getMasterPlaylistKeyCacheTtlSeconds.mockReturnValue(30);
    streamConfig.getRewrittenPlaylistCacheTtlSeconds.mockReturnValue(10);
    textCache.get.mockResolvedValue(null);
    textCache.set.mockResolvedValue(undefined);
    useCase = new StreamVideoSegmentUseCase(
      playbackTokenVerifier as never,
      objectStorageService as never,
      textCache as never,
      streamConfig as never,
      videoRepository as never,
    );
  });

  it('rewrites variant playlist segment urls with the playback token', async () => {
    playbackTokenVerifier.verifyToken.mockReturnValue({
      videoId: 'video-1',
      userId: 'viewer-1',
      channelId: 'channel-1',
    });
    videoRepository.findBasicById.mockResolvedValue(buildVideo());
    objectStorageService.getObjectText.mockResolvedValue(
      '#EXTM3U\n720p_000.ts',
    );

    await expect(
      useCase.execute({
        videoId: 'video-1',
        token: 'playback-token',
        segmentName: '720p.m3u8',
      }),
    ).resolves.toEqual({
      contentType: 'application/vnd.apple.mpegurl',
      body: '#EXTM3U\n/api/media/stream/video-1/segments/segments%2F720p_000.ts?token=playback-token',
    });

    expect(objectStorageService.getObjectStream).not.toHaveBeenCalled();
  });

  it('falls back to the shared segments directory for root-level segment urls', async () => {
    const missingObjectError = new Error('The specified key does not exist.');
    const segmentStream = new PassThrough();

    playbackTokenVerifier.verifyToken.mockReturnValue({
      videoId: 'video-1',
      userId: 'viewer-1',
      channelId: 'channel-1',
    });
    videoRepository.findBasicById.mockResolvedValue(buildVideo());
    objectStorageService.getObjectStream
      .mockRejectedValueOnce(missingObjectError)
      .mockResolvedValueOnce(segmentStream);

    const result = await useCase.execute({
      videoId: 'video-1',
      token: 'playback-token',
      segmentName: '720p_000.ts',
    });

    expect(result).toEqual({
      contentType: 'video/mp2t',
      body: segmentStream,
    });
    expect(objectStorageService.getObjectStream).toHaveBeenNthCalledWith(
      1,
      'processed',
      'processed/720p_000.ts',
    );
    expect(objectStorageService.getObjectStream).toHaveBeenNthCalledWith(
      2,
      'processed',
      'processed/segments/720p_000.ts',
    );
  });

  it('keeps nested variant playlist paths when rewriting segment urls', async () => {
    playbackTokenVerifier.verifyToken.mockReturnValue({
      videoId: 'video-1',
      userId: 'viewer-1',
      channelId: 'channel-1',
    });
    videoRepository.findBasicById.mockResolvedValue(buildVideo());
    objectStorageService.getObjectText.mockResolvedValue(
      '#EXTM3U\n720p_000.ts',
    );

    await expect(
      useCase.execute({
        videoId: 'video-1',
        token: 'playback-token',
        segmentName: '720p/index.m3u8',
      }),
    ).resolves.toEqual({
      contentType: 'application/vnd.apple.mpegurl',
      body: '#EXTM3U\n/api/media/stream/video-1/segments/720p%2F720p_000.ts?token=playback-token',
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
