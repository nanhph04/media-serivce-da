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
    copyObject: jest.fn(),
    deleteObject: jest.fn(),
  };
  const videoProcessingJobDispatcher = {
    enqueueTranscodeJob: jest.fn(),
  };
  const videoOutboxTransaction = {
    saveVideoWithOutbox: jest.fn(),
  };
  const videoUploadConfig = {
    getMaxVideoUploadSizeBytes: jest.fn(),
  };
  const videoStatusEventPublisher = {
    publishVideoStatusChanged: jest.fn(),
  };
  const loggerService = {
    setContext: jest.fn(),
    logWarn: jest.fn(),
  };

  const useCase = new ConfirmVideoUploadUseCase(
    videoRepository as never,
    objectStorageService as never,
    videoOutboxTransaction as never,
    videoUploadConfig as never,
    videoStatusEventPublisher as never,
    loggerService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    videoUploadConfig.getMaxVideoUploadSizeBytes.mockReturnValue(
      2 * 1024 * 1024 * 1024,
    );
    objectStorageService.getBucketName.mockReturnValue('media-raw');
    objectStorageService.copyObject.mockResolvedValue(undefined);
    objectStorageService.deleteObject.mockResolvedValue(undefined);
    videoOutboxTransaction.saveVideoWithOutbox.mockResolvedValue(undefined);
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
    objectStorageService.objectExists.mockResolvedValue(true);
    objectStorageService.getObjectMetadata.mockResolvedValue({
      sizeBytes: 1024,
    });

    const result = await useCase.execute({
      userId: 'owner-1',
      videoId: 'video-1',
      resolutions: ['1080p', '480p', '720p'],
    });

    const [savedVideo, outboxMessage] = videoOutboxTransaction
      .saveVideoWithOutbox.mock.calls[0] as [
      VideoEntity,
      { topic: string; messageKey: string; payload: { data: unknown } },
    ];
    expect(savedVideo.resolutions).toEqual(['480p', '720p', '1080p']);
    expect(videoOutboxTransaction.saveVideoWithOutbox).toHaveBeenCalledTimes(1);
    expect(outboxMessage).toMatchObject({
      topic: 'video.moderation.requested',
      messageKey: 'video-1',
      payload: {
        eventType: 'video.moderation.requested',
        aggregateId: 'video-1',
        sourceService: 'media-service',
        data: {
          videoId: 'video-1',
          rawFileKey: expect.stringMatching(
            /^uploads\/confirmed\/video-1\/.+\.mp4$/,
          ),
          rawBucket: 'media-raw',
          resolutions: ['480p', '720p', '1080p'],
          userId: 'owner-1',
        },
      },
    });
    expect(objectStorageService.copyObject).toHaveBeenCalledWith(
      'raw',
      'uploads/raw/channel-1/video.mp4',
      expect.stringMatching(/^uploads\/confirmed\/video-1\/.+\.mp4$/),
    );
    expect(objectStorageService.deleteObject).toHaveBeenCalledWith(
      'raw',
      'uploads/raw/channel-1/video.mp4',
    );
    expect(
      videoProcessingJobDispatcher.enqueueTranscodeJob,
    ).not.toHaveBeenCalled();
    expect(result.status).toBe(VideoStatus.PENDING_MODERATION);
    expect(result.message).toBe('Video is waiting for moderation');
    expect(
      videoStatusEventPublisher.publishVideoStatusChanged,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        videoId: 'video-1',
        userId: 'owner-1',
        status: VideoStatus.PENDING_MODERATION,
        jobStatus: 'waiting',
      }),
    );
  });

  it('does not mark pending moderation when immutable copy fails', async () => {
    const video = buildDraftVideo();
    videoRepository.findById.mockResolvedValue(video);
    objectStorageService.objectExists.mockResolvedValue(true);
    objectStorageService.getObjectMetadata.mockResolvedValue({
      sizeBytes: 1024,
    });
    objectStorageService.copyObject.mockRejectedValue(new Error('copy failed'));

    await expect(
      useCase.execute({
        userId: 'owner-1',
        videoId: 'video-1',
        resolutions: ['720p'],
      }),
    ).rejects.toThrow('copy failed');

    expect(videoRepository.save).not.toHaveBeenCalled();
    expect(videoOutboxTransaction.saveVideoWithOutbox).not.toHaveBeenCalled();
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
    thumbnailObjectKey: null,
    thumbnailSource: 'auto' as never,
    thumbnailStatus: 'pending' as never,
    thumbnailGeneratedAt: null,
    thumbnailError: null,
    durationSeconds: null,
    resolutions: [],
    errorMessage: null,
    viewCount: 0,
    publishedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}
