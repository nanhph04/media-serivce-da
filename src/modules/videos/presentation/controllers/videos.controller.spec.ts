import { VideoStatus, VideoVisibility } from '../../domain/entities/video.entity';
import { VideosController } from './videos.controller';

describe('VideosController', () => {
  const initVideoUploadUseCase = {
    execute: jest.fn(),
  };
  const confirmVideoUploadUseCase = {
    execute: jest.fn(),
  };
  const playVideoUseCase = {
    execute: jest.fn(),
  };
  const refreshPlaybackTokenUseCase = {
    execute: jest.fn(),
  };
  const getLatestVideosUseCase = {
    execute: jest.fn(),
  };
  const getVideosByCategoryUseCase = {
    execute: jest.fn(),
  };
  const getSubscribedVideosUseCase = {
    execute: jest.fn(),
  };
  const getVideoMetadataUseCase = {
    execute: jest.fn(),
  };
  const updateVideoMetadataUseCase = {
    execute: jest.fn(),
  };
  const controller = new VideosController(
    initVideoUploadUseCase as never,
    confirmVideoUploadUseCase as never,
    playVideoUseCase as never,
    refreshPlaybackTokenUseCase as never,
    getLatestVideosUseCase as never,
    getVideosByCategoryUseCase as never,
    getSubscribedVideosUseCase as never,
    getVideoMetadataUseCase as never,
    updateVideoMetadataUseCase as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns video metadata response dto', async () => {
    getVideoMetadataUseCase.execute.mockResolvedValue(buildMetadata());

    const result = await controller.getMetadata('video-1');

    expect(getVideoMetadataUseCase.execute).toHaveBeenCalledWith('video-1');
    expect(result).toEqual({
      id: 'video-1',
      title: 'Video',
      description: 'Description',
      thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
      status: VideoStatus.PUBLIC,
      visibility: VideoVisibility.PUBLIC,
      publishedAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    });
  });

  it('updates metadata using current user id', async () => {
    updateVideoMetadataUseCase.execute.mockResolvedValue({
      ...buildMetadata(),
      title: 'Updated Video',
    });

    const result = await controller.updateMetadata('owner-1', 'video-1', {
      title: 'Updated Video',
    });

    expect(updateVideoMetadataUseCase.execute).toHaveBeenCalledWith({
      userId: 'owner-1',
      videoId: 'video-1',
      title: 'Updated Video',
      description: undefined,
      thumbnailUrl: undefined,
    });
    expect(result).toMatchObject({
      id: 'video-1',
      title: 'Updated Video',
    });
  });

  it('keeps latest discovery routed through latest use case', async () => {
    getLatestVideosUseCase.execute.mockResolvedValue([]);

    await controller.latest('20');

    expect(getLatestVideosUseCase.execute).toHaveBeenCalledWith({
      limit: 20,
    });
  });
});

function buildMetadata(): {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  status: VideoStatus;
  visibility: VideoVisibility;
  publishedAt: Date;
  updatedAt: Date;
} {
  return {
    id: 'video-1',
    title: 'Video',
    description: 'Description',
    thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
    status: VideoStatus.PUBLIC,
    visibility: VideoVisibility.PUBLIC,
    publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };
}
