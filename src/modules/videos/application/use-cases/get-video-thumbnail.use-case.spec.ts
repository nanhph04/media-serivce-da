import { Readable } from 'stream';
import {
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  Category,
  CategoryStatus,
} from '../../../categories/domain/entities/category.entity';
import {
  ChannelEntity,
  ChannelStatus,
} from '../../../channels/domain/entities/channel.entity';
import {
  VideoDeletionStatus,
  VideoEntity,
  VideoStatus,
  VideoThumbnailSource,
  VideoThumbnailStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { GetVideoThumbnailUseCase } from './get-video-thumbnail.use-case';

describe('GetVideoThumbnailUseCase', () => {
  const videoRepository = {
    findBasicById: jest.fn(),
  };
  const channelRepository = {
    findById: jest.fn(),
  };
  const objectStorageService = {
    objectExists: jest.fn(),
    getObjectStream: jest.fn(),
  };
  const useCase = new GetVideoThumbnailUseCase(
    videoRepository as never,
    channelRepository as never,
    objectStorageService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    channelRepository.findById.mockResolvedValue(buildChannel());
    objectStorageService.objectExists.mockResolvedValue(true);
    objectStorageService.getObjectStream.mockResolvedValue(
      Readable.from(['thumbnail']),
    );
  });

  it('streams public thumbnail for ready public active video', async () => {
    videoRepository.findBasicById.mockResolvedValue(buildVideo());

    const result = await useCase.execute({
      videoId: 'video-1',
      mode: 'public',
    });

    expect(objectStorageService.objectExists).toHaveBeenCalledWith(
      'processed',
      'videos/video-1/thumbnails/default.jpg',
    );
    expect(objectStorageService.getObjectStream).toHaveBeenCalledWith(
      'processed',
      'videos/video-1/thumbnails/default.jpg',
    );
    expect(result.contentType).toBe('image/jpeg');
    expect(result.cacheControl).toBe('public, max-age=3600');
  });

  it('rejects public thumbnail for private video', async () => {
    videoRepository.findBasicById.mockResolvedValue(
      buildVideo({ visibility: VideoVisibility.PRIVATE }),
    );

    await expect(
      useCase.execute({ videoId: 'video-1', mode: 'public' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects public thumbnail when channel is inactive', async () => {
    videoRepository.findBasicById.mockResolvedValue(buildVideo());
    channelRepository.findById.mockResolvedValue(
      buildChannel({ status: ChannelStatus.INACTIVE }),
    );

    await expect(
      useCase.execute({ videoId: 'video-1', mode: 'public' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('streams owner thumbnail for owner regardless of video status', async () => {
    videoRepository.findBasicById.mockResolvedValue(
      buildVideo({
        status: VideoStatus.PROCESSING,
        visibility: VideoVisibility.PRIVATE,
      }),
    );

    const result = await useCase.execute({
      videoId: 'video-1',
      mode: 'owner',
      userId: 'owner-1',
    });

    expect(result.cacheControl).toBe('private, max-age=300');
  });

  it('rejects owner thumbnail for non-owner', async () => {
    videoRepository.findBasicById.mockResolvedValue(buildVideo());

    await expect(
      useCase.execute({
        videoId: 'video-1',
        mode: 'owner',
        userId: 'other-user',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects missing or not ready thumbnail', async () => {
    videoRepository.findBasicById.mockResolvedValue(
      buildVideo({ thumbnailStatus: VideoThumbnailStatus.PROCESSING }),
    );

    await expect(
      useCase.execute({
        videoId: 'video-1',
        mode: 'owner',
        userId: 'owner-1',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});

function buildVideo(
  overrides: Partial<{
    status: VideoStatus;
    visibility: VideoVisibility;
    deletionStatus: VideoDeletionStatus;
    thumbnailStatus: VideoThumbnailStatus;
  }> = {},
): VideoEntity {
  const now = new Date('2026-01-01T00:00:00.000Z');

  return new VideoEntity({
    id: 'video-1',
    channelId: 'channel-1',
    ownerId: 'owner-1',
    title: 'Video',
    description: 'Description',
    category: new Category({
      id: 'category-1',
      name: 'Music',
      slug: 'music',
      description: null,
      parentId: null,
      status: CategoryStatus.ACTIVE,
      displayOrder: 0,
      createdAt: now,
      updatedAt: now,
    }),
    tags: [],
    visibility: overrides.visibility ?? VideoVisibility.PUBLIC,
    status: overrides.status ?? VideoStatus.READY,
    price: 0,
    requiredTierLevel: null,
    rawFileKey: 'uploads/raw/channel-1/video.mp4',
    masterPlaylistKey: 'videos/video-1/master.m3u8',
    thumbnailObjectKey: 'videos/video-1/thumbnails/default.jpg',
    thumbnailUrl: 'http://minio/thumbnail.jpg',
    thumbnailSource: VideoThumbnailSource.AUTO,
    thumbnailStatus: overrides.thumbnailStatus ?? VideoThumbnailStatus.READY,
    thumbnailGeneratedAt: now,
    thumbnailError: null,
    durationSeconds: 120,
    resolutions: ['720p'],
    errorMessage: null,
    viewCount: 0,
    publishedAt: now,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    deleteReason: null,
    deletionStatus: overrides.deletionStatus ?? VideoDeletionStatus.ACTIVE,
    deleteRequestedAt: null,
    refundCompletedAt: null,
    refundSummary: null,
    createdAt: now,
    updatedAt: now,
    statusChangedAt: now,
  });
}

function buildChannel(
  overrides: Partial<{ status: ChannelStatus }> = {},
): ChannelEntity {
  const now = new Date('2026-01-01T00:00:00.000Z');

  return new ChannelEntity({
    id: 'channel-1',
    userId: 'owner-1',
    name: 'Cinema Labs',
    bio: '',
    avatarUrl: '',
    bannerUrl: '',
    status: overrides.status ?? ChannelStatus.ACTIVE,
    isEligibleForMembership: false,
    isMembershipClosedByAdmin: false,
    createdAt: now,
    updatedAt: now,
  });
}
