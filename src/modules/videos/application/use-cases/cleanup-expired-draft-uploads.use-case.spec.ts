import {
  VideoEntity,
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { CleanupExpiredDraftUploadsUseCase } from './cleanup-expired-draft-uploads.use-case';

describe('CleanupExpiredDraftUploadsUseCase', () => {
  const videoRepository = {
    findExpiredDrafts: jest.fn(),
    deleteDraftById: jest.fn(),
  };
  const objectStorageService = {
    objectExists: jest.fn(),
    deleteObject: jest.fn(),
  };
  const configService = {
    getVideoDraftUploadTtlHours: jest.fn(),
    getVideoDraftCleanupBatchSize: jest.fn(),
  };
  const loggerService = {
    setContext: jest.fn(),
    logInfo: jest.fn(),
    logWarn: jest.fn(),
  };

  const useCase = new CleanupExpiredDraftUploadsUseCase(
    videoRepository as never,
    objectStorageService as never,
    configService as never,
    loggerService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-01-02T00:00:00.000Z'));
    configService.getVideoDraftUploadTtlHours.mockReturnValue(24);
    configService.getVideoDraftCleanupBatchSize.mockReturnValue(100);
    objectStorageService.objectExists.mockResolvedValue(true);
    objectStorageService.deleteObject.mockResolvedValue(undefined);
    videoRepository.deleteDraftById.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('cleans up expired draft uploads returned by the repository', async () => {
    videoRepository.findExpiredDrafts.mockResolvedValue([buildVideo()]);

    await useCase.execute();

    expect(videoRepository.findExpiredDrafts).toHaveBeenCalledWith(
      new Date('2026-01-01T00:00:00.000Z'),
      100,
    );
    expect(objectStorageService.deleteObject).toHaveBeenCalledWith(
      'raw',
      'uploads/raw/channel-1/video.mp4',
    );
    expect(videoRepository.deleteDraftById).toHaveBeenCalledWith('video-1');
  });

  it('continues when one draft cleanup fails', async () => {
    videoRepository.findExpiredDrafts.mockResolvedValue([
      buildVideo({ id: 'video-1', rawFileKey: 'uploads/raw/1.mp4' }),
      buildVideo({ id: 'video-2', rawFileKey: 'uploads/raw/2.mp4' }),
    ]);
    objectStorageService.deleteObject
      .mockRejectedValueOnce(new Error('minio down'))
      .mockResolvedValueOnce(undefined);

    await useCase.execute();

    expect(loggerService.logWarn).toHaveBeenCalledWith(
      'Failed to clean up expired draft upload',
      expect.objectContaining({ videoId: 'video-1' }),
    );
    expect(videoRepository.deleteDraftById).toHaveBeenCalledWith('video-2');
  });
});

function buildVideo(
  overrides: Partial<{
    id: string;
    rawFileKey: string;
  }> = {},
): VideoEntity {
  return new VideoEntity({
    id: overrides.id ?? 'video-1',
    channelId: 'channel-1',
    ownerId: 'owner-1',
    title: 'Video',
    description: 'Description',
    category: [],
    tags: [],
    visibility: VideoVisibility.PUBLIC,
    status: VideoStatus.DRAFT,
    price: 0,
    requiredTierLevel: null,
    rawFileKey: overrides.rawFileKey ?? 'uploads/raw/channel-1/video.mp4',
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
