import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  VideoEntity,
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { DeleteFailedVideoUseCase } from './delete-failed-video.use-case';

describe('DeleteFailedVideoUseCase', () => {
  const videoRepository = {
    findById: jest.fn(),
    deleteFailedById: jest.fn(),
  };
  const objectStorageService = {
    objectExists: jest.fn(),
    deleteObject: jest.fn(),
  };
  const useCase = new DeleteFailedVideoUseCase(
    videoRepository as never,
    objectStorageService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    objectStorageService.objectExists.mockResolvedValue(true);
    objectStorageService.deleteObject.mockResolvedValue(undefined);
    videoRepository.deleteFailedById.mockResolvedValue(undefined);
  });

  it('deletes raw object and failed video row', async () => {
    videoRepository.findById.mockResolvedValue(buildVideo());

    const result = await useCase.execute({
      userId: 'owner-1',
      videoId: 'video-1',
    });

    expect(objectStorageService.deleteObject).toHaveBeenCalledWith(
      'raw',
      'uploads/raw/channel-1/video.mp4',
    );
    expect(videoRepository.deleteFailedById).toHaveBeenCalledWith('video-1');
    expect(result).toEqual({
      videoId: 'video-1',
      deleted: true,
    });
  });

  it('deletes failed row when raw object is not present', async () => {
    videoRepository.findById.mockResolvedValue(buildVideo());
    objectStorageService.objectExists.mockResolvedValue(false);

    await useCase.execute({ userId: 'owner-1', videoId: 'video-1' });

    expect(objectStorageService.deleteObject).not.toHaveBeenCalled();
    expect(videoRepository.deleteFailedById).toHaveBeenCalledWith('video-1');
  });

  it('deletes rejected video row', async () => {
    videoRepository.findById.mockResolvedValue(
      buildVideo({ status: VideoStatus.REJECTED }),
    );

    const result = await useCase.execute({
      userId: 'owner-1',
      videoId: 'video-1',
    });

    expect(videoRepository.deleteFailedById).toHaveBeenCalledWith('video-1');
    expect(result).toEqual({
      videoId: 'video-1',
      deleted: true,
    });
  });
  it('throws not found when video does not exist', async () => {
    videoRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'owner-1', videoId: 'missing' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws forbidden when user does not own the video', async () => {
    videoRepository.findById.mockResolvedValue(
      buildVideo({ ownerId: 'owner-2' }),
    );

    await expect(
      useCase.execute({ userId: 'owner-1', videoId: 'video-1' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it.each([
    VideoStatus.DRAFT,
    VideoStatus.PENDING_MODERATION,
    VideoStatus.PROCESSING,
    VideoStatus.PENDING_MANUAL_REVIEW,
    VideoStatus.READY,
  ])('throws conflict when video status is %s', async (status) => {
    videoRepository.findById.mockResolvedValue(buildVideo({ status }));

    await expect(
      useCase.execute({ userId: 'owner-1', videoId: 'video-1' }),
    ).rejects.toThrow(ConflictException);
  });
});

function buildVideo(
  overrides: Partial<{
    ownerId: string;
    status: VideoStatus;
  }> = {},
): VideoEntity {
  return new VideoEntity({
    id: 'video-1',
    channelId: 'channel-1',
    ownerId: overrides.ownerId ?? 'owner-1',
    title: 'Video',
    description: 'Description',
    category: [],
    tags: [],
    visibility: VideoVisibility.PUBLIC,
    status: overrides.status ?? VideoStatus.FAILED,
    price: 0,
    requiredTierLevel: null,
    rawFileKey: 'uploads/raw/channel-1/video.mp4',
    masterPlaylistKey: null,
    thumbnailUrl: null,
    durationSeconds: null,
    resolutions: [],
    errorMessage: 'Processing failed',
    viewCount: 0,
    publishedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}
