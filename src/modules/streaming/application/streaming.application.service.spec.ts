import { PassThrough, Readable } from 'stream';
import { NotFoundException } from '@shared/domain/exceptions/domain.exception';
import { StreamingApplicationService } from './streaming.application.service';
import { VideoEntity, VideoStatus, VideoVisibility } from '../../videos/domain/entities/video.entity';
import type { Response } from 'express';

describe('StreamingApplicationService', () => {
  const playbackTokenService = {
    verifyToken: jest.fn(),
  };
  const minioService = {
    getProcessedBucket: jest.fn(),
    getObjectText: jest.fn(),
    getObjectStream: jest.fn(),
  };
  const cacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };
  const configService = {
    getNumber: jest.fn(),
  };
  const recordVideoViewUseCase = {
    execute: jest.fn(),
  };
  const videoRepository = {
    findBasicById: jest.fn(),
  };

  let service: StreamingApplicationService;

  beforeEach(() => {
    jest.clearAllMocks();
    minioService.getProcessedBucket.mockReturnValue('processed');
    configService.getNumber.mockImplementation(
      (_key: string, defaultValue: number) => defaultValue,
    );
    cacheService.get.mockResolvedValue(null);
    cacheService.set.mockResolvedValue(undefined);
    service = new StreamingApplicationService(
      playbackTokenService as never,
      minioService as never,
      cacheService as never,
      configService as never,
      recordVideoViewUseCase as never,
      videoRepository as never,
    );
  });

  it('records a view after loading the master playlist successfully', async () => {
    playbackTokenService.verifyToken.mockReturnValue({
      videoId: 'video-1',
      userId: 'viewer-1',
      channelId: 'channel-1',
    });
    videoRepository.findBasicById.mockResolvedValue(buildVideo());
    minioService.getObjectText.mockResolvedValue('#EXTM3U\nsegment.ts');

    await expect(
      service.streamMasterPlaylist('video-1', 'playback-token'),
    ).resolves.toContain(
      '/api/media/stream/video-1/segments/segments%2Fsegment.ts?token=playback-token',
    );

    expect(recordVideoViewUseCase.execute).toHaveBeenCalledWith({
      userId: 'viewer-1',
      videoId: 'video-1',
    });
  });

  it('does not record a view when the master playlist is missing', async () => {
    playbackTokenService.verifyToken.mockReturnValue({
      videoId: 'video-1',
      userId: 'viewer-1',
      channelId: 'channel-1',
    });
    videoRepository.findBasicById.mockResolvedValue(null);

    await expect(
      service.streamMasterPlaylist('video-1', 'playback-token'),
    ).rejects.toThrow(NotFoundException);

    expect(recordVideoViewUseCase.execute).not.toHaveBeenCalled();
  });

  it('does not record a view while streaming segments', async () => {
    playbackTokenService.verifyToken.mockReturnValue({
      videoId: 'video-1',
      userId: 'viewer-1',
      channelId: 'channel-1',
    });
    videoRepository.findBasicById.mockResolvedValue(buildVideo());
    minioService.getObjectStream.mockResolvedValue({
      on: jest.fn(),
      pipe: (destination: Response) => {
        setImmediate(() => {
          destination.emit('close');
        });
        return destination;
      },
    });

    const response = createResponse();

    await service.pipeSegment(
      {
        videoId: 'video-1',
        token: 'playback-token',
        segmentName: 'segment.ts',
      },
      response,
    );

    expect(recordVideoViewUseCase.execute).not.toHaveBeenCalled();
  });

  it('rewrites variant playlist segment urls with the playback token', async () => {
    playbackTokenService.verifyToken.mockReturnValue({
      videoId: 'video-1',
      userId: 'viewer-1',
      channelId: 'channel-1',
    });
    videoRepository.findBasicById.mockResolvedValue(buildVideo());
    minioService.getObjectText.mockResolvedValue('#EXTM3U\n720p_000.ts');

    const response = createResponse();

    await service.pipeSegment(
      {
        videoId: 'video-1',
        token: 'playback-token',
        segmentName: '720p.m3u8',
      },
      response,
    );

    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/vnd.apple.mpegurl',
    );
    expect(response.send).toHaveBeenCalledWith(
      '#EXTM3U\n/api/media/stream/video-1/segments/segments%2F720p_000.ts?token=playback-token',
    );
    expect(minioService.getObjectStream).not.toHaveBeenCalled();
  });

  it('falls back to the shared segments directory for root-level segment urls', async () => {
    const missingObjectError = new Error('The specified key does not exist.');
    const segmentStream = {
      on: jest.fn(),
      pipe: (destination: Response) => {
        setImmediate(() => {
          destination.emit('close');
        });
        return destination;
      },
    };

    playbackTokenService.verifyToken.mockReturnValue({
      videoId: 'video-1',
      userId: 'viewer-1',
      channelId: 'channel-1',
    });
    videoRepository.findBasicById.mockResolvedValue(buildVideo());
    minioService.getObjectStream
      .mockRejectedValueOnce(missingObjectError)
      .mockResolvedValueOnce(segmentStream);

    const response = createResponse();
    await service.pipeSegment(
      {
        videoId: 'video-1',
        token: 'playback-token',
        segmentName: '720p_000.ts',
      },
      response,
    );

    expect(minioService.getObjectStream).toHaveBeenNthCalledWith(
      1,
      'processed',
      'processed/720p_000.ts',
    );
    expect(minioService.getObjectStream).toHaveBeenNthCalledWith(
      2,
      'processed',
      'processed/segments/720p_000.ts',
    );
  });

  it('keeps nested variant playlist paths when rewriting segment urls', async () => {
    playbackTokenService.verifyToken.mockReturnValue({
      videoId: 'video-1',
      userId: 'viewer-1',
      channelId: 'channel-1',
    });
    videoRepository.findBasicById.mockResolvedValue(buildVideo());
    minioService.getObjectText.mockResolvedValue('#EXTM3U\n720p_000.ts');

    const response = createResponse();

    await service.pipeSegment(
      {
        videoId: 'video-1',
        token: 'playback-token',
        segmentName: '720p/index.m3u8',
      },
      response,
    );

    expect(response.send).toHaveBeenCalledWith(
      '#EXTM3U\n/api/media/stream/video-1/segments/720p%2F720p_000.ts?token=playback-token',
    );
  });

  it('reuses cached playlist data on repeated master playlist requests', async () => {
    playbackTokenService.verifyToken.mockReturnValue({
      videoId: 'video-1',
      userId: 'viewer-1',
      channelId: 'channel-1',
    });
    videoRepository.findBasicById.mockResolvedValue(buildVideo());
    minioService.getObjectText.mockResolvedValue('#EXTM3U\nsegment.ts');

    await service.streamMasterPlaylist('video-1', 'playback-token');

    cacheService.get.mockImplementation(async (key: string) => {
      if (key.includes('master-playlist-key')) {
        return 'processed/master.m3u8';
      }
      if (key.includes('playlist:processed%2Fmaster.m3u8')) {
        return '#EXTM3U\n/api/media/stream/video-1/segments/segments%2Fsegment.ts?token=playback-token';
      }
      return null;
    });

    await expect(
      service.streamMasterPlaylist('video-1', 'playback-token'),
    ).resolves.toBe(
      '#EXTM3U\n/api/media/stream/video-1/segments/segments%2Fsegment.ts?token=playback-token',
    );

    expect(videoRepository.findBasicById).toHaveBeenCalledTimes(1);
    expect(minioService.getObjectText).toHaveBeenCalledTimes(1);
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

function createResponse(): {
  setHeader: jest.Mock;
  send: jest.Mock;
} & Response {
  const response = new PassThrough() as PassThrough & {
    setHeader: jest.Mock;
    send: jest.Mock;
  };
  response.setHeader = jest.fn();
  response.send = jest.fn();
  return response as Response & {
    setHeader: jest.Mock;
    send: jest.Mock;
  };
}
