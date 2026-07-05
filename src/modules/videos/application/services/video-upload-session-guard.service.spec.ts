import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import { ConflictException } from '@shared/domain/exceptions/domain.exception';
import {
  VideoEntity,
  VideoStatus,
  VideoThumbnailSource,
  VideoThumbnailStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import {
  type VideoUploadSession,
  VideoUploadSessionStatus,
} from '../../domain/repositories/video-upload-session.repository';
import { VideoUploadSessionGuardService } from './video-upload-session-guard.service';

describe('VideoUploadSessionGuardService', () => {
  const videoRepository = {
    findById: jest.fn(),
  };
  const uploadSessionRepository = {
    findByVideoAndUploadId: jest.fn(),
  };
  const service = new VideoUploadSessionGuardService(
    videoRepository as never,
    uploadSessionRepository as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects an expired upload session even when it is still active', async () => {
    videoRepository.findById.mockResolvedValue(buildDraftVideo());
    uploadSessionRepository.findByVideoAndUploadId.mockResolvedValue(
      buildUploadSession({ expiresAt: new Date('2026-01-01T00:00:00.000Z') }),
    );

    await expect(
      service.getActiveOwnedDraftSession({
        userId: 'owner-1',
        videoId: 'video-1',
        uploadId: 'upload-1',
      }),
    ).rejects.toMatchObject({
      constructor: ConflictException,
      message: ERROR_MESSAGES.UPLOAD_SESSION_NOT_ACTIVE,
    });
  });
});

function buildDraftVideo(): VideoEntity {
  return new VideoEntity({
    id: 'video-1',
    channelId: 'channel-1',
    ownerId: 'owner-1',
    title: 'Video',
    description: 'Description',
    category: [] as never,
    tags: [],
    visibility: VideoVisibility.PUBLIC,
    status: VideoStatus.DRAFT,
    price: 0,
    requiredTierLevel: null,
    rawFileKey: 'uploads/raw/channel-1/video.mp4',
    masterPlaylistKey: null,
    thumbnailObjectKey: null,
    thumbnailUrl: null,
    thumbnailSource: VideoThumbnailSource.AUTO,
    thumbnailStatus: VideoThumbnailStatus.PENDING,
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

function buildUploadSession(
  overrides: Partial<Pick<VideoUploadSession, 'expiresAt'>> = {},
): VideoUploadSession {
  return {
    id: 'session-1',
    videoId: 'video-1',
    userId: 'owner-1',
    rawFileKey: 'uploads/raw/channel-1/video.mp4',
    uploadId: 'upload-1',
    partSizeBytes: 5 * 1024 * 1024,
    fileName: 'video.mp4',
    fileSize: 10 * 1024 * 1024,
    fileLastModified: new Date('2026-01-01T00:00:00.000Z'),
    status: VideoUploadSessionStatus.ACTIVE,
    expiresAt: overrides.expiresAt ?? new Date('2026-12-31T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    parts: [],
  };
}
