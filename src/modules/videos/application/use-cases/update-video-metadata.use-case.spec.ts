import {
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  VideoEntity,
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { UpdateVideoMetadataUseCase } from './update-video-metadata.use-case';

describe('UpdateVideoMetadataUseCase', () => {
  const videoRepository = {
    findById: jest.fn(),
    save: jest.fn(),
  };
  const videoCacheInvalidator = {
    invalidateMetadata: jest.fn(),
  };
  const useCase = new UpdateVideoMetadataUseCase(
    videoRepository as never,
    videoCacheInvalidator as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates metadata for owner and invalidates only metadata cache', async () => {
    const video = buildVideo();
    videoRepository.findById.mockResolvedValue(video);
    videoRepository.save.mockResolvedValue(undefined);
    videoCacheInvalidator.invalidateMetadata.mockResolvedValue(undefined);

    const result = await useCase.execute({
      userId: 'owner-1',
      videoId: 'video-1',
      title: 'Updated Video',
      description: 'Updated description',
      thumbnailUrl: null,
    });

    expect(videoRepository.save).toHaveBeenCalledWith(video);
    expect(videoCacheInvalidator.invalidateMetadata).toHaveBeenCalledWith(
      'video-1',
    );
    expect(result).toMatchObject({
      id: 'video-1',
      title: 'Updated Video',
      description: 'Updated description',
      thumbnailUrl: null,
    });
  });

  it('throws forbidden when user does not own video', async () => {
    videoRepository.findById.mockResolvedValue(buildVideo());

    await expect(
      useCase.execute({
        userId: 'other-user',
        videoId: 'video-1',
        title: 'Updated Video',
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(videoRepository.save).not.toHaveBeenCalled();
    expect(videoCacheInvalidator.invalidateMetadata).not.toHaveBeenCalled();
  });

  it('throws not found when video does not exist', async () => {
    videoRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'owner-1',
        videoId: 'missing-video',
        title: 'Updated Video',
      }),
    ).rejects.toThrow(NotFoundException);
    expect(videoRepository.save).not.toHaveBeenCalled();
  });

  it('returns updated metadata after cache invalidation', async () => {
    videoRepository.findById.mockResolvedValue(buildVideo());
    videoRepository.save.mockResolvedValue(undefined);
    videoCacheInvalidator.invalidateMetadata.mockResolvedValue(undefined);

    await expect(
      useCase.execute({
        userId: 'owner-1',
        videoId: 'video-1',
        title: 'Updated Video',
      }),
    ).resolves.toMatchObject({
      title: 'Updated Video',
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
    status: VideoStatus.PUBLIC,
    price: 0,
    requiredTierLevel: null,
    rawFileKey: 'raw/video.mp4',
    masterPlaylistKey: 'processed/master.m3u8',
    thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
    durationSeconds: 120,
    resolutions: ['720p'],
    errorMessage: null,
    viewCount: 0,
    publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}
