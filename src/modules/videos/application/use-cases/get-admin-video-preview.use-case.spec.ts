import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  VideoEntity,
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import type { IVideoRepository } from '../../domain/repositories/video.repository';
import { GetAdminVideoPreviewUseCase } from './get-admin-video-preview.use-case';

const objectStorageService = {
  objectExists: jest.fn(),
  createReadUrl: jest.fn(),
};

describe('GetAdminVideoPreviewUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    objectStorageService.objectExists.mockResolvedValue(true);
    objectStorageService.createReadUrl.mockResolvedValue(
      'http://localhost/raw.mp4?signature=abc',
    );
  });

  it('returns a signed raw preview URL for pending manual review videos', async () => {
    const useCase = createUseCase({
      video: buildVideo(VideoStatus.PENDING_MANUAL_REVIEW),
    });

    const result = await useCase.execute({
      adminId: 'admin-1',
      role: 'admin',
      videoId: 'video-1',
    });

    expect(objectStorageService.objectExists).toHaveBeenCalledWith(
      'raw',
      'uploads/raw/channel-1/video.mp4',
    );
    expect(objectStorageService.createReadUrl).toHaveBeenCalledWith(
      'raw',
      'uploads/raw/channel-1/video.mp4',
      900,
    );
    expect(result).toMatchObject({
      videoId: 'video-1',
      previewUrl: 'http://localhost/raw.mp4?signature=abc',
      evidenceTimestampSeconds: 12,
      moderationDetails: {
        reason: 'NSFW score 0.72 at 00:12 requires manual review',
        confidence: 0.72,
        evidenceTimestampSeconds: 12,
        label: 'sexy',
        nsfwScore: 0.72,
        safeScore: 0.28,
        sampledFrameCount: 4,
        thresholds: { manual: 0.6, reject: 0.9 },
      },
    });
    expect(result.expiresAt).toBeInstanceOf(Date);
  });

  it.each([
    VideoStatus.REJECTED,
    VideoStatus.PENDING_MODERATION,
    VideoStatus.PROCESSING,
  ])('allows preview for %s videos while raw exists', async (status) => {
    const useCase = createUseCase({ video: buildVideo(status) });

    await expect(
      useCase.execute({
        adminId: 'admin-1',
        role: 'admin',
        videoId: 'video-1',
      }),
    ).resolves.toMatchObject({ videoId: 'video-1' });
  });

  it('rejects non-admin callers', async () => {
    const useCase = createUseCase({
      video: buildVideo(VideoStatus.PENDING_MANUAL_REVIEW),
    });

    await expect(
      useCase.execute({
        adminId: 'user-1',
        role: 'creator',
        videoId: 'video-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects empty video id', async () => {
    const useCase = createUseCase();

    await expect(
      useCase.execute({
        adminId: 'admin-1',
        role: 'admin',
        videoId: ' ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects missing videos', async () => {
    const useCase = createUseCase();

    await expect(
      useCase.execute({
        adminId: 'admin-1',
        role: 'admin',
        videoId: 'missing',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects unsupported statuses', async () => {
    const useCase = createUseCase({ video: buildVideo(VideoStatus.READY) });

    await expect(
      useCase.execute({
        adminId: 'admin-1',
        role: 'admin',
        videoId: 'video-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects missing raw preview objects', async () => {
    objectStorageService.objectExists.mockResolvedValue(false);
    const useCase = createUseCase({
      video: buildVideo(VideoStatus.PENDING_MANUAL_REVIEW),
    });

    await expect(
      useCase.execute({
        adminId: 'admin-1',
        role: 'admin',
        videoId: 'video-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

function createUseCase(input?: {
  video?: VideoEntity;
}): GetAdminVideoPreviewUseCase {
  return new GetAdminVideoPreviewUseCase(
    createVideoRepository(input),
    objectStorageService as never,
  );
}

function createVideoRepository(input?: {
  video?: VideoEntity;
}): IVideoRepository {
  return {
    findAdminVideoById: jest.fn().mockResolvedValue(input?.video ?? null),
  } as unknown as IVideoRepository;
}

function buildVideo(status: VideoStatus): VideoEntity {
  return new VideoEntity({
    id: 'video-1',
    channelId: 'channel-1',
    ownerId: 'owner-1',
    title: 'Video',
    description: 'Description',
    category: [] as never,
    tags: [],
    visibility: VideoVisibility.PUBLIC,
    status,
    price: 0,
    requiredTierLevel: null,
    rawFileKey: 'uploads/raw/channel-1/video.mp4',
    masterPlaylistKey: null,
    thumbnailObjectKey: null,
    thumbnailUrl: null,
    thumbnailSource: 'auto' as never,
    thumbnailStatus: 'pending' as never,
    thumbnailGeneratedAt: null,
    thumbnailError: null,
    durationSeconds: null,
    resolutions: [],
    errorMessage: null,
    moderationDetails: {
      reason: 'NSFW score 0.72 at 00:12 requires manual review',
      confidence: 0.72,
      evidenceTimestampSeconds: 12,
      label: 'sexy',
      nsfwScore: 0.72,
      safeScore: 0.28,
      sampledFrameCount: 4,
      thresholds: { manual: 0.6, reject: 0.9 },
    },
    viewCount: 0,
    publishedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    statusChangedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}
