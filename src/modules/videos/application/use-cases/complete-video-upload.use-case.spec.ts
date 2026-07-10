import { ConflictException } from '@shared/domain/exceptions/domain.exception';
import {
  VideoEntity,
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import {
  type VideoUploadSession,
  VideoUploadSessionStatus,
} from '../../domain/repositories/video-upload-session.repository';
import { VideoUploadSessionGuardService } from '../services/video-upload-session-guard.service';
import { CompleteVideoUploadUseCase } from './complete-video-upload.use-case';

describe('CompleteVideoUploadUseCase', () => {
  const videoRepository = {
    findById: jest.fn(),
  };
  const uploadSessionRepository = {
    findByVideoAndUploadId: jest.fn(),
    markCompleted: jest.fn(),
  };
  const objectStorageService = {
    completeMultipartUpload: jest.fn(),
    objectExists: jest.fn(),
  };
  const guardService = new VideoUploadSessionGuardService(
    videoRepository as never,
    uploadSessionRepository as never,
  );
  const useCase = new CompleteVideoUploadUseCase(
    uploadSessionRepository as never,
    objectStorageService as never,
    guardService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    videoRepository.findById.mockResolvedValue(buildDraftVideo());
    uploadSessionRepository.findByVideoAndUploadId.mockResolvedValue(
      buildSession(),
    );
    uploadSessionRepository.markCompleted.mockResolvedValue(undefined);
    objectStorageService.completeMultipartUpload.mockResolvedValue(undefined);
    objectStorageService.objectExists.mockResolvedValue(false);
  });

  it('reconciles DB completion on retry when storage was already completed', async () => {
    const dbError = new Error('DB unavailable');
    uploadSessionRepository.markCompleted
      .mockRejectedValueOnce(dbError)
      .mockResolvedValueOnce(undefined);
    objectStorageService.objectExists
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    await expect(useCase.execute(buildCommand())).rejects.toThrow(dbError);
    await expect(useCase.execute(buildCommand())).resolves.toEqual({
      videoId: 'video-1',
      uploadId: 'upload-1',
      rawFileKey: 'uploads/raw/channel-1/video.mp4',
      completed: true,
    });

    expect(objectStorageService.completeMultipartUpload).toHaveBeenCalledTimes(
      1,
    );
    expect(uploadSessionRepository.markCompleted).toHaveBeenCalledTimes(2);
  });

  it('returns success for an already completed upload session', async () => {
    uploadSessionRepository.findByVideoAndUploadId.mockResolvedValue(
      buildSession({ status: VideoUploadSessionStatus.COMPLETED }),
    );

    await expect(useCase.execute(buildCommand())).resolves.toMatchObject({
      videoId: 'video-1',
      uploadId: 'upload-1',
      rawFileKey: 'uploads/raw/channel-1/video.mp4',
      completed: true,
    });

    expect(objectStorageService.completeMultipartUpload).not.toHaveBeenCalled();
    expect(uploadSessionRepository.markCompleted).not.toHaveBeenCalled();
  });

  it('reconciles concurrent completion when storage reports the upload is already complete', async () => {
    objectStorageService.completeMultipartUpload.mockRejectedValue(
      new Error('NoSuchUpload'),
    );
    objectStorageService.objectExists.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    await expect(useCase.execute(buildCommand())).resolves.toMatchObject({
      videoId: 'video-1',
      uploadId: 'upload-1',
      completed: true,
    });

    expect(uploadSessionRepository.markCompleted).toHaveBeenCalledTimes(1);
  });

  it('keeps throwing storage completion errors when the raw object does not exist', async () => {
    const storageError = new Error('storage failed');
    objectStorageService.completeMultipartUpload.mockRejectedValue(storageError);
    objectStorageService.objectExists.mockResolvedValue(false);

    await expect(useCase.execute(buildCommand())).rejects.toThrow(storageError);

    expect(uploadSessionRepository.markCompleted).not.toHaveBeenCalled();
  });

  it('throws conflict for aborted upload sessions', async () => {
    uploadSessionRepository.findByVideoAndUploadId.mockResolvedValue(
      buildSession({ status: VideoUploadSessionStatus.ABORTED }),
    );

    await expect(useCase.execute(buildCommand())).rejects.toThrow(
      ConflictException,
    );
  });
});

function buildCommand(): { userId: string; videoId: string; uploadId: string } {
  return {
    userId: 'owner-1',
    videoId: 'video-1',
    uploadId: 'upload-1',
  };
}

function buildSession(
  overrides: Partial<Pick<VideoUploadSession, 'status' | 'expiresAt'>> = {},
): VideoUploadSession {
  return {
    id: 'session-1',
    videoId: 'video-1',
    userId: 'owner-1',
    rawFileKey: 'uploads/raw/channel-1/video.mp4',
    uploadId: 'upload-1',
    partSizeBytes: 5,
    fileName: 'video.mp4',
    fileSize: 10,
    fileLastModified: new Date('2026-01-01T00:00:00.000Z'),
    status: overrides.status ?? VideoUploadSessionStatus.ACTIVE,
    expiresAt: overrides.expiresAt ?? new Date('2099-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    parts: [
      {
        partNumber: 1,
        etag: 'etag-1',
        sizeBytes: 5,
        uploadedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        partNumber: 2,
        etag: 'etag-2',
        sizeBytes: 5,
        uploadedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ],
  };
}

function buildDraftVideo(): VideoEntity {
  return new VideoEntity({
    id: 'video-1',
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
