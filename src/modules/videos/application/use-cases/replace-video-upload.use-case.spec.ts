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
import { ReplaceVideoUploadUseCase } from './replace-video-upload.use-case';

describe('ReplaceVideoUploadUseCase', () => {
  const videoRepository = {
    findById: jest.fn(),
    save: jest.fn(),
  };
  const objectStorageService = {
    getBucketName: jest.fn(),
    createUploadUrl: jest.fn(),
    objectExists: jest.fn(),
    deleteObject: jest.fn(),
  };
  const loggerService = {
    setContext: jest.fn(),
    logWarn: jest.fn(),
  };

  const useCase = new ReplaceVideoUploadUseCase(
    videoRepository as never,
    objectStorageService as never,
    loggerService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    objectStorageService.getBucketName.mockReturnValue('media-raw');
    objectStorageService.createUploadUrl.mockResolvedValue(
      'https://upload.example.com/new',
    );
    objectStorageService.objectExists.mockResolvedValue(true);
    objectStorageService.deleteObject.mockResolvedValue(undefined);
  });

  it('replaces a draft raw file key and returns a fresh upload URL', async () => {
    videoRepository.findById.mockResolvedValue(buildVideo());
    videoRepository.save.mockResolvedValue(undefined);

    const result = await useCase.execute({
      userId: 'owner-1',
      videoId: 'video-1',
    });

    expect(videoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'video-1',
        status: VideoStatus.DRAFT,
      }),
    );
    expect(result).toEqual({
      videoId: 'video-1',
      status: VideoStatus.DRAFT,
      rawFileKey: expect.stringMatching(/^uploads\/raw\/channel-1\/.+\.mp4$/),
      bucket: 'media-raw',
      uploadUrl: 'https://upload.example.com/new',
    });
    expect(objectStorageService.deleteObject).toHaveBeenCalledWith(
      'raw',
      'uploads/raw/channel-1/old.mp4',
    );
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

  it('throws conflict when video is no longer draft', async () => {
    videoRepository.findById.mockResolvedValue(
      buildVideo({ status: VideoStatus.PENDING_MODERATION }),
    );

    await expect(
      useCase.execute({ userId: 'owner-1', videoId: 'video-1' }),
    ).rejects.toThrow(ConflictException);
  });

  it('keeps the new upload when deleting the previous object fails', async () => {
    videoRepository.findById.mockResolvedValue(buildVideo());
    objectStorageService.deleteObject.mockRejectedValue(
      new Error('minio down'),
    );

    await expect(
      useCase.execute({ userId: 'owner-1', videoId: 'video-1' }),
    ).resolves.toMatchObject({
      videoId: 'video-1',
      status: VideoStatus.DRAFT,
    });
    expect(loggerService.logWarn).toHaveBeenCalled();
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
    status: overrides.status ?? VideoStatus.DRAFT,
    price: 0,
    requiredTierLevel: null,
    rawFileKey: 'uploads/raw/channel-1/old.mp4',
    masterPlaylistKey: null,
    thumbnailUrl: null,
    durationSeconds: null,
    resolutions: [],
    errorMessage: null,
    viewCount: 0,
    publishedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}
