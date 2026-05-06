import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { VideoEntity } from '../../domain/entities/video.entity';
import { ConfirmVideoUploadUseCase } from './confirm-video-upload.use-case';

describe('ConfirmVideoUploadUseCase', () => {
  const videoRepository = {
    findById: jest.fn(),
    save: jest.fn(),
  };
  const objectStorageService = {
    objectExists: jest.fn(),
    getObjectMetadata: jest.fn(),
    getBucketName: jest.fn(),
  };
  const videoProcessingJobDispatcher = {
    enqueueTranscodeJob: jest.fn(),
  };
  const videoModerationRequestPublisher = {
    publishModerationRequested: jest.fn(),
  };
  const videoUploadConfig = {
    getMaxVideoUploadSizeBytes: jest.fn(),
  };
  const videoProgressService = {
    applyProgressUpdate: jest.fn(),
    createSnapshot: jest.fn().mockImplementation((input) => input),
  };

  const useCase = new ConfirmVideoUploadUseCase(
    videoRepository as never,
    objectStorageService as never,
    videoModerationRequestPublisher as never,
    videoUploadConfig as never,
    videoProgressService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    videoUploadConfig.getMaxVideoUploadSizeBytes.mockReturnValue(
      2 * 1024 * 1024 * 1024,
    );
    objectStorageService.getBucketName.mockReturnValue('media-raw');
  });

  it('rejects when uploaded file exceeds maximum size', async () => {
    videoRepository.findById.mockResolvedValue(buildDraftVideo());
    objectStorageService.objectExists.mockResolvedValue(true);
    objectStorageService.getObjectMetadata.mockResolvedValue({
      sizeBytes: 3 * 1024 * 1024 * 1024,
    });

    await expect(
      useCase.execute({
        userId: 'owner-1',
        videoId: 'video-1',
        resolutions: ['1080p'],
      }),
    ).rejects.toThrow(BadRequestException);

    expect(videoRepository.save).not.toHaveBeenCalled();
    expect(
      videoProcessingJobDispatcher.enqueueTranscodeJob,
    ).not.toHaveBeenCalled();
  });

  it('rejects empty uploaded file metadata', async () => {
    videoRepository.findById.mockResolvedValue(buildDraftVideo());
    objectStorageService.objectExists.mockResolvedValue(true);
    objectStorageService.getObjectMetadata.mockResolvedValue({ sizeBytes: 0 });

    await expect(
      useCase.execute({
        userId: 'owner-1',
        videoId: 'video-1',
        resolutions: ['720p'],
      }),
    ).rejects.toThrow('Uploaded video file is empty or invalid');
  });

  it('normalizes resolution order before requesting moderation', async () => {
    videoRepository.findById.mockResolvedValue(buildDraftVideo());
    videoRepository.save.mockResolvedValue(undefined);
    objectStorageService.objectExists.mockResolvedValue(true);
    objectStorageService.getObjectMetadata.mockResolvedValue({
      sizeBytes: 1024,
    });
    videoModerationRequestPublisher.publishModerationRequested.mockResolvedValue(
      undefined,
    );

    const result = await useCase.execute({
      userId: 'owner-1',
      videoId: 'video-1',
      resolutions: ['1080p', '480p', '720p'],
    });

    expect(videoRepository.save).toHaveBeenCalledTimes(1);
    expect(videoModerationRequestPublisher.publishModerationRequested).toHaveBeenCalledWith({
      videoId: 'video-1',
      rawFileKey: 'uploads/raw/channel-1/video.mp4',
      rawBucket: 'media-raw',
      resolution: ['480p', '720p', '1080p'],
      userId: 'owner-1',
    });
    expect(videoProcessingJobDispatcher.enqueueTranscodeJob).not.toHaveBeenCalled();
    expect(videoProgressService.applyProgressUpdate).toHaveBeenCalled();
    expect(result.status).toBe(VideoStatus.PENDING_MODERATION);
  });

  it('throws not found when video does not exist', async () => {
    videoRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'owner-1',
        videoId: 'missing',
        resolutions: ['720p'],
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws forbidden when user does not own the video', async () => {
    videoRepository.findById.mockResolvedValue(
      buildDraftVideo({ ownerId: 'owner-2' }),
    );

    await expect(
      useCase.execute({
        userId: 'owner-1',
        videoId: 'video-1',
        resolutions: ['720p'],
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});

function buildDraftVideo(
  overrides: Partial<{ ownerId: string }> = {},
): VideoEntity {
  return new VideoEntity({
    id: 'video-1',
    channelId: 'channel-1',
    ownerId: overrides.ownerId ?? 'owner-1',
    title: 'Video',
    description: 'Description',
    category: [],
    visibility: VideoVisibility.PUBLIC,
    status: VideoStatus.DRAFT,
    price: 0,
    requiredTierLevel: null,
    rawFileKey: 'uploads/raw/channel-1/video.mp4',
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
