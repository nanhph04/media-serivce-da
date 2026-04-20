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
  const recordVideoViewUseCase = {
    execute: jest.fn(),
  };
  const videoRepository = {
    findById: jest.fn(),
  };

  const service = new StreamingApplicationService(
    playbackTokenService as never,
    minioService as never,
    recordVideoViewUseCase as never,
    videoRepository as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    minioService.getProcessedBucket.mockReturnValue('processed');
  });

  it('records a view after loading the master playlist successfully', async () => {
    playbackTokenService.verifyToken.mockReturnValue({
      videoId: 'video-1',
      userId: 'viewer-1',
      channelId: 'channel-1',
    });
    videoRepository.findById.mockResolvedValue(buildVideo());
    minioService.getObjectText.mockResolvedValue('#EXTM3U\nsegment.ts');

    await expect(
      service.streamMasterPlaylist('video-1', 'playback-token'),
    ).resolves.toContain('/api/media/stream/video-1/segments/segment.ts?token=playback-token');

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
    videoRepository.findById.mockResolvedValue(null);

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
    videoRepository.findById.mockResolvedValue(buildVideo());
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
    status: VideoStatus.PUBLIC,
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
} & Response {
  const response = new PassThrough() as PassThrough & {
    setHeader: jest.Mock;
  };
  response.setHeader = jest.fn();
  return response as Response & {
    setHeader: jest.Mock;
  };
}
