import {
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  VideoEntity,
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import {
  Category,
  CategoryStatus,
} from '../../../categories/domain/entities/category.entity';
import { Tag, TagStatus } from '../../../tags/domain/entities/tag.entity';
import { UpdateVideoMetadataUseCase } from './update-video-metadata.use-case';
import {
  ChannelEntity,
  ChannelStatus,
} from '../../../channels/domain/entities/channel.entity';
import { MembershipTierEntity } from '../../../channels/domain/entities/membership-tier.entity';

describe('UpdateVideoMetadataUseCase', () => {
  const videoRepository = {
    findById: jest.fn(),
    save: jest.fn(),
  };
  const videoCacheInvalidator = {
    invalidateMetadata: jest.fn(),
    invalidateDiscoveryLists: jest.fn(),
  };
  const categoryRepository = {
    findById: jest.fn(),
  };
  const tagRepository = {
    findByIds: jest.fn(),
  };
  const channelRepository = {
    findById: jest.fn(),
  };
  const membershipTierRepository = {
    findByChannelId: jest.fn(),
  };
  const useCase = new UpdateVideoMetadataUseCase(
    videoRepository as never,
    videoCacheInvalidator as never,
    categoryRepository as never,
    tagRepository as never,
    channelRepository as never,
    membershipTierRepository as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates metadata for owner and invalidates metadata and discovery caches', async () => {
    const video = buildVideo();
    videoRepository.findById.mockResolvedValue(video);
    videoRepository.save.mockResolvedValue(undefined);
    videoCacheInvalidator.invalidateMetadata.mockResolvedValue(undefined);
    videoCacheInvalidator.invalidateDiscoveryLists.mockResolvedValue(undefined);
    channelRepository.findById.mockResolvedValue(buildChannel());
    membershipTierRepository.findByChannelId.mockResolvedValue([
      buildMembershipTier(),
    ]);

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
    expect(videoCacheInvalidator.invalidateDiscoveryLists).toHaveBeenCalled();
    expect(result).toMatchObject({
      id: 'video-1',
      channelId: 'channel-1',
      channelName: 'Cinema Labs',
      avatarUrlChannel: 'https://cdn.example.com/channel-avatar.jpg',
      membershipTiers: [buildMembershipTier()],
      title: 'Updated Video',
      description: 'Updated description',
      categoryId: 'category-1',
      category: 'music',
      tagIds: ['tag-1'],
      tags: ['action'],
      thumbnailUrl: null,
    });
  });

  it('returns category and tag ids with slug fields after updating metadata', async () => {
    const video = buildVideo();
    videoRepository.findById.mockResolvedValue(video);
    channelRepository.findById.mockResolvedValue(buildChannel());
    membershipTierRepository.findByChannelId.mockResolvedValue([
      buildMembershipTier(),
    ]);
    categoryRepository.findById.mockResolvedValue(
      new Category({
        id: 'category-2',
        name: 'Cinematic Shorts',
        slug: 'cinematic-shorts',
        description: null,
        parentId: null,
        status: CategoryStatus.ACTIVE,
        displayOrder: 0,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      }),
    );
    tagRepository.findByIds.mockResolvedValue([
      new Tag({
        id: 'tag-2',
        name: 'Film',
        slug: 'film',
        status: TagStatus.ACTIVE,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      }),
    ]);
    videoRepository.save.mockResolvedValue(undefined);
    videoCacheInvalidator.invalidateMetadata.mockResolvedValue(undefined);
    videoCacheInvalidator.invalidateDiscoveryLists.mockResolvedValue(undefined);

    const result = await useCase.execute({
      userId: 'owner-1',
      videoId: 'video-1',
      categoryId: 'category-2',
      tagIds: ['tag-2'],
    });

    expect(result).toMatchObject({
      categoryId: 'category-2',
      category: 'cinematic-shorts',
      tagIds: ['tag-2'],
      tags: ['film'],
    });
  });

  it('updates visibility for owner', async () => {
    const video = buildVideo();
    videoRepository.findById.mockResolvedValue(video);
    videoRepository.save.mockResolvedValue(undefined);
    videoCacheInvalidator.invalidateMetadata.mockResolvedValue(undefined);
    videoCacheInvalidator.invalidateDiscoveryLists.mockResolvedValue(undefined);
    channelRepository.findById.mockResolvedValue(buildChannel());
    membershipTierRepository.findByChannelId.mockResolvedValue([]);

    const result = await useCase.execute({
      userId: 'owner-1',
      videoId: 'video-1',
      visibility: VideoVisibility.PRIVATE,
    });

    expect(video.visibility).toBe(VideoVisibility.PRIVATE);
    expect(videoCacheInvalidator.invalidateDiscoveryLists).toHaveBeenCalled();
    expect(result).toMatchObject({
      visibility: VideoVisibility.PRIVATE,
    });
  });

  it('updates price and required tier level for owner', async () => {
    const video = buildVideo();
    videoRepository.findById.mockResolvedValue(video);
    videoRepository.save.mockResolvedValue(undefined);
    videoCacheInvalidator.invalidateMetadata.mockResolvedValue(undefined);
    videoCacheInvalidator.invalidateDiscoveryLists.mockResolvedValue(undefined);
    channelRepository.findById.mockResolvedValue(buildChannel());
    membershipTierRepository.findByChannelId.mockResolvedValue([
      buildMembershipTier(),
    ]);

    const result = await useCase.execute({
      userId: 'owner-1',
      videoId: 'video-1',
      price: 100,
      requiredTierLevel: 2,
    });

    expect(video.price).toBe(100);
    expect(video.requiredTierLevel).toBe(2);
    expect(result).toMatchObject({
      price: 100,
      requiredTierLevel: 2,
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
    expect(videoCacheInvalidator.invalidateDiscoveryLists).not.toHaveBeenCalled();
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
    videoCacheInvalidator.invalidateDiscoveryLists.mockResolvedValue(undefined);
    channelRepository.findById.mockResolvedValue(buildChannel());
    membershipTierRepository.findByChannelId.mockResolvedValue([
      buildMembershipTier(),
    ]);

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
    category: new Category({
      id: 'category-1',
      name: 'Music',
      slug: 'music',
      description: null,
      parentId: null,
      status: CategoryStatus.ACTIVE,
      displayOrder: 0,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    }),
    tags: [
      new Tag({
        id: 'tag-1',
        name: 'Action',
        slug: 'action',
        status: TagStatus.ACTIVE,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      }),
    ],
    visibility: VideoVisibility.PUBLIC,
    status: VideoStatus.READY,
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

function buildChannel(): ChannelEntity {
  return new ChannelEntity({
    id: 'channel-1',
    userId: 'owner-1',
    name: 'Cinema Labs',
    bio: 'Short films',
    avatarUrl: 'https://cdn.example.com/channel-avatar.jpg',
    bannerUrl: '',
    status: ChannelStatus.ACTIVE,
    isEligibleForMembership: false,
    isMembershipClosedByAdmin: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  });
}

function buildMembershipTier(): MembershipTierEntity {
  return new MembershipTierEntity({
    id: 'tier-1',
    channelId: 'channel-1',
    name: 'Supporter',
    level: 1,
    priceCoin: 100,
    isAcceptingNew: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  });
}
