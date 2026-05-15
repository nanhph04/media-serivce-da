import { NotFoundException } from '@shared/domain/exceptions/domain.exception';
import {
  Category,
  CategoryStatus,
} from '../../../categories/domain/entities/category.entity';
import { Tag, TagStatus } from '../../../tags/domain/entities/tag.entity';
import {
  VideoEntity,
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { VIDEO_CACHE_KEYS, VIDEO_CACHE_TTL_SECONDS } from '../cache.constants';
import { VideoQueryService } from './video-query.service';

describe('VideoQueryService', () => {
  const videoRepository = {
    findBasicById: jest.fn(),
    findById: jest.fn(),
    getChannelMembershipEligibilityMetrics: jest.fn(),
    findStudioByOwnerId: jest.fn(),
    findPublicByChannelId: jest.fn(),
    findLatestPublic: jest.fn(),
    findByCategory: jest.fn(),
    findByCategoryPaged: jest.fn(),
    searchPublic: jest.fn(),
  };
  const createQueryBuilder = jest.fn();
  const watchProgressOrmRepository = {
    createQueryBuilder,
  };
  const channelOrmRepository = {
    findOne: jest.fn(),
  };
  const membershipTierOrmRepository = {
    find: jest.fn(),
  };
  const cacheService = {
    get: jest.fn(),
    set: jest.fn(),
    getKeys: jest.fn(),
  };
  const service = new VideoQueryService(
    videoRepository as never,
    watchProgressOrmRepository as never,
    channelOrmRepository as never,
    membershipTierOrmRepository as never,
    cacheService as never,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns metadata from cache without querying database', async () => {
    cacheService.get.mockResolvedValue({
      id: 'video-1',
      channelId: 'channel-1',
      channelName: 'Cinema Labs',
      avatarUrlChannel: 'https://cdn.example.com/channel-avatar.jpg',
      membershipTiers: [buildCachedMembershipTier()],
      title: 'Cached Video',
      description: 'Cached description',
      categoryId: 'category-1',
      category: 'music',
      tagIds: ['tag-1'],
      tags: ['action'],
      thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
      viewCount: 7,
      status: VideoStatus.READY,
      visibility: VideoVisibility.PUBLIC,
      errorMessage: null,
      publishedAt: '2026-01-01T00:00:00.000Z',
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      deleteReason: null,
      updatedAt: '2026-01-02T00:00:00.000Z',
    });

    const result = await service.getVideoMetadata('video-1');

    expect(result).toEqual({
      id: 'video-1',
      channelId: 'channel-1',
      channelName: 'Cinema Labs',
      avatarUrlChannel: 'https://cdn.example.com/channel-avatar.jpg',
      membershipTiers: [
        {
          ...buildMembershipTier(),
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        },
      ],
      title: 'Cached Video',
      description: 'Cached description',
      categoryId: 'category-1',
      category: 'music',
      tagIds: ['tag-1'],
      tags: ['action'],
      thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
      viewCount: 7,
      status: VideoStatus.READY,
      visibility: VideoVisibility.PUBLIC,
      errorMessage: null,
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      deleteReason: null,
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    expect(videoRepository.findBasicById).not.toHaveBeenCalled();
  });

  it('caches metadata on cache miss', async () => {
    cacheService.get.mockResolvedValue(null);
    videoRepository.findBasicById.mockResolvedValue(buildVideo());
    channelOrmRepository.findOne.mockResolvedValue(buildChannelRow());
    membershipTierOrmRepository.find.mockResolvedValue([buildMembershipTier()]);

    await expect(service.getVideoMetadata('video-1')).resolves.toEqual({
      id: 'video-1',
      channelId: 'channel-1',
      channelName: 'Cinema Labs',
      avatarUrlChannel: 'https://cdn.example.com/channel-avatar.jpg',
      membershipTiers: [buildMembershipTier()],
      title: 'Video',
      description: 'Description',
      thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
      viewCount: 10,
      status: VideoStatus.READY,
      jobStatus: 'succeeded',
      jobStatusMessage: 'Video processing completed',
      failureReason: null,
      moderationDetails: null,
      visibility: VideoVisibility.PUBLIC,
      categoryId: 'category-1',
      category: 'music',
      tagIds: ['tag-1'],
      tags: ['action'],
      errorMessage: null,
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      deleteReason: null,
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    expect(cacheService.set).toHaveBeenCalledWith(
      VIDEO_CACHE_KEYS.metadata('video-1'),
      {
        id: 'video-1',
        channelId: 'channel-1',
        channelName: 'Cinema Labs',
        avatarUrlChannel: 'https://cdn.example.com/channel-avatar.jpg',
        membershipTiers: [buildCachedMembershipTier()],
        title: 'Video',
        description: 'Description',
        categoryId: 'category-1',
        category: 'music',
        tagIds: ['tag-1'],
        tags: ['action'],
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        viewCount: 10,
        status: VideoStatus.READY,
        jobStatus: 'succeeded',
        jobStatusMessage: 'Video processing completed',
        failureReason: null,
        moderationDetails: null,
        visibility: VideoVisibility.PUBLIC,
        errorMessage: null,
        publishedAt: '2026-01-01T00:00:00.000Z',
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        deleteReason: null,
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
      VIDEO_CACHE_TTL_SECONDS.metadata,
    );
  });

  it('throws not found for missing or non-public metadata', async () => {
    cacheService.get.mockResolvedValue(null);
    videoRepository.findBasicById.mockResolvedValue(
      buildVideo({ status: VideoStatus.DRAFT }),
    );

    await expect(service.getVideoMetadata('video-1')).rejects.toThrow(
      NotFoundException,
    );
    expect(cacheService.set).not.toHaveBeenCalled();
  });

  it('falls back to database when metadata cache get fails', async () => {
    cacheService.get.mockRejectedValue(new Error('redis unavailable'));
    videoRepository.findBasicById.mockResolvedValue(buildVideo());
    channelOrmRepository.findOne.mockResolvedValue(buildChannelRow());
    membershipTierOrmRepository.find.mockResolvedValue([buildMembershipTier()]);

    await expect(service.getVideoMetadata('video-1')).resolves.toMatchObject({
      id: 'video-1',
    });
    expect(videoRepository.findBasicById).toHaveBeenCalledWith('video-1');
  });

  it('returns database metadata when cache set fails', async () => {
    cacheService.get.mockResolvedValue(null);
    cacheService.set.mockRejectedValue(new Error('redis unavailable'));
    videoRepository.findBasicById.mockResolvedValue(buildVideo());
    channelOrmRepository.findOne.mockResolvedValue(buildChannelRow());
    membershipTierOrmRepository.find.mockResolvedValue([buildMembershipTier()]);

    await expect(service.getVideoMetadata('video-1')).resolves.toMatchObject({
      id: 'video-1',
    });
  });

  it('returns latest videos from cache without querying database', async () => {
    cacheService.get
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce([buildCachedListItem()]);

    const result = await service.getLatestVideos(20);

    expect(result[0].createdAt).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    expect(videoRepository.findLatestPublic).not.toHaveBeenCalled();
    expect(cacheService.getKeys).not.toHaveBeenCalled();
  });

  it('caches latest videos on cache miss', async () => {
    cacheService.get.mockResolvedValueOnce(0).mockResolvedValueOnce(null);
    videoRepository.findLatestPublic.mockResolvedValue([buildVideo()]);

    await service.getLatestVideos(20);

    expect(cacheService.set).toHaveBeenCalledWith(
      VIDEO_CACHE_KEYS.latest(0, 20),
      [buildCachedListItem()],
      VIDEO_CACHE_TTL_SECONDS.discoveryList,
    );
  });

  it('returns paginated category discovery results and caches them by page', async () => {
    cacheService.get.mockResolvedValueOnce(0).mockResolvedValueOnce(null);
    videoRepository.findByCategoryPaged.mockResolvedValue({
      items: [buildVideo()],
      total: 25,
    });

    await expect(service.getVideosByCategory('music', 2, 10)).resolves.toEqual({
      items: [
        {
          id: 'video-1',
          channelId: 'channel-1',
          title: 'Video',
          description: 'Description',
          category: 'music',
          tags: ['action'],
          status: VideoStatus.READY,
          price: 0,
          requiredTierLevel: null,
          thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
          durationSeconds: 120,
          resolutions: ['720p'],
          errorMessage: null,
          viewCount: 10,
          publishedAt: new Date('2026-01-01T00:00:00.000Z'),
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        },
      ],
      pagination: {
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      },
    });

    expect(videoRepository.findByCategoryPaged).toHaveBeenCalledWith({
      category: 'music',
      page: 2,
      limit: 10,
    });
    expect(cacheService.set).toHaveBeenCalledWith(
      VIDEO_CACHE_KEYS.categoryPage(0, 'music', 2, 10),
      {
        items: [buildCachedListItem()],
        total: 25,
      },
      VIDEO_CACHE_TTL_SECONDS.discoveryList,
    );
    expect(cacheService.getKeys).not.toHaveBeenCalled();
  });

  it('returns paginated category discovery from cache', async () => {
    cacheService.get.mockResolvedValueOnce(0).mockResolvedValueOnce({
      items: [buildCachedListItem()],
      total: 1,
    });

    const result = await service.getVideosByCategory('music', 1, 20);

    expect(result.items[0].id).toBe('video-1');
    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
    expect(videoRepository.searchPublic).not.toHaveBeenCalled();
  });

  it('searches public videos by keyword and category with short-lived cache', async () => {
    cacheService.get.mockResolvedValueOnce(4).mockResolvedValueOnce(null);
    videoRepository.searchPublic.mockResolvedValue([buildVideo()]);

    await expect(
      service.searchPublicVideos({
        q: 'piano',
        category: 'music',
        limit: 5,
      }),
    ).resolves.toEqual([
      {
        id: 'video-1',
        channelId: 'channel-1',
        title: 'Video',
        description: 'Description',
        category: 'music',
        tags: ['action'],
        status: VideoStatus.READY,
        price: 0,
        requiredTierLevel: null,
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        durationSeconds: 120,
        resolutions: ['720p'],
        errorMessage: null,
        viewCount: 10,
        publishedAt: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);

    expect(videoRepository.searchPublic).toHaveBeenCalledWith({
      q: 'piano',
      category: 'music',
      limit: 5,
    });
    expect(cacheService.set).toHaveBeenCalledWith(
      VIDEO_CACHE_KEYS.publicSearch(4, 'piano', 'music', undefined, 5),
      [buildCachedListItem()],
      VIDEO_CACHE_TTL_SECONDS.publicSearch,
    );
  });

  it('returns search results from cache without querying repository', async () => {
    cacheService.get
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce([buildCachedListItem()]);

    const result = await service.searchPublicVideos({
      q: 'piano',
      limit: 3,
    });

    expect(result[0].updatedAt).toEqual(new Date('2026-01-02T00:00:00.000Z'));
    expect(videoRepository.searchPublic).not.toHaveBeenCalled();
    expect(cacheService.get).toHaveBeenNthCalledWith(
      1,
      VIDEO_CACHE_KEYS.publicSearchVersion(),
    );
    expect(cacheService.get).toHaveBeenNthCalledWith(
      2,
      VIDEO_CACHE_KEYS.publicSearch(2, 'piano', undefined, undefined, 3),
    );
  });

  it('returns studio videos directly from repository without discovery cache', async () => {
    videoRepository.findStudioByOwnerId.mockResolvedValue([
      buildVideo({
        status: VideoStatus.DRAFT,
        visibility: VideoVisibility.PRIVATE,
      }),
    ]);

    await expect(
      service.getStudioVideos('owner-1', {
        limit: 20,
        statuses: [VideoStatus.DRAFT],
        visibilities: [VideoVisibility.PRIVATE],
      }),
    ).resolves.toEqual([
      {
        id: 'video-1',
        channelId: 'channel-1',
        title: 'Video',
        description: 'Description',
        category: 'music',
        tags: ['action'],
        status: VideoStatus.DRAFT,
        jobStatus: 'waiting',
        jobStatusMessage: 'Upload initialized',
        failureReason: null,
        moderationDetails: null,
        visibility: VideoVisibility.PRIVATE,
        price: 0,
        requiredTierLevel: null,
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        durationSeconds: 120,
        resolutions: ['720p'],
        errorMessage: null,
        viewCount: 10,
        publishedAt: new Date('2026-01-01T00:00:00.000Z'),
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        deleteReason: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);
    expect(videoRepository.findStudioByOwnerId).toHaveBeenCalledWith(
      'owner-1',
      {
        limit: 20,
        statuses: [VideoStatus.DRAFT],
        visibilities: [VideoVisibility.PRIVATE],
      },
    );
  });

  it('switches to a versioned latest cache key when the version changes', async () => {
    cacheService.get.mockResolvedValueOnce(3).mockResolvedValueOnce(null);
    videoRepository.findLatestPublic.mockResolvedValue([buildVideo()]);

    await service.getLatestVideos(20);

    expect(cacheService.set).toHaveBeenCalledWith(
      VIDEO_CACHE_KEYS.latest(3, 20),
      [buildCachedListItem()],
      VIDEO_CACHE_TTL_SECONDS.discoveryList,
    );
  });

  it('returns continue watching rows ordered by last watched time', async () => {
    const getRawMany = jest.fn().mockResolvedValue([
      {
        videoId: 'video-1',
        channelId: 'channel-1',
        resumePositionSeconds: 45,
        progressDurationSeconds: null,
        lastWatchedAt: '2026-01-03T00:00:00.000Z',
        title: 'Video',
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        videoDurationSeconds: 120,
        viewCount: 10,
      },
    ]);
    const queryBuilder = {
      innerJoin: jest.fn(),
      where: jest.fn(),
      andWhere: jest.fn(),
      orderBy: jest.fn(),
      take: jest.fn(),
      select: jest.fn(),
      getRawMany,
    };
    queryBuilder.innerJoin.mockReturnValue(queryBuilder);
    queryBuilder.where.mockReturnValue(queryBuilder);
    queryBuilder.andWhere.mockReturnValue(queryBuilder);
    queryBuilder.orderBy.mockReturnValue(queryBuilder);
    queryBuilder.take.mockReturnValue(queryBuilder);
    queryBuilder.select.mockReturnValue(queryBuilder);
    createQueryBuilder.mockReturnValue(queryBuilder);

    await expect(service.getContinueWatching('viewer-1', 20)).resolves.toEqual([
      {
        videoId: 'video-1',
        channelId: 'channel-1',
        title: 'Video',
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        durationSeconds: 120,
        resumePositionSeconds: 45,
        remainingSeconds: 75,
        lastWatchedAt: new Date('2026-01-03T00:00:00.000Z'),
        viewCount: 10,
      },
    ]);
  });

  it('returns channel membership eligibility metrics from repository', async () => {
    videoRepository.getChannelMembershipEligibilityMetrics.mockResolvedValue({
      readyVideoCount: 5,
      totalVideoViews: 1000,
    });

    await expect(
      service.getChannelMembershipEligibilityMetrics('channel-1'),
    ).resolves.toEqual({
      readyVideoCount: 5,
      totalVideoViews: 1000,
    });
  });
});

function buildVideo(
  overrides: Partial<{
    status: VideoStatus;
    visibility: VideoVisibility;
  }> = {},
): VideoEntity {
  return new VideoEntity({
    id: 'video-1',
    channelId: 'channel-1',
    ownerId: 'owner-1',
    title: 'Video',
    description: 'Description',
    category: buildCategory(),
    tags: [buildTag()],
    visibility: overrides.visibility ?? VideoVisibility.PUBLIC,
    status: overrides.status ?? VideoStatus.READY,
    price: 0,
    requiredTierLevel: null,
    rawFileKey: 'raw/video.mp4',
    masterPlaylistKey: 'processed/master.m3u8',
    thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
    durationSeconds: 120,
    resolutions: ['720p'],
    errorMessage: null,
    viewCount: 10,
    publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  });
}

function buildCachedListItem(): {
  id: string;
  channelId: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  status: string;
  price: number;
  requiredTierLevel: number | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  resolutions: string[];
  errorMessage: string | null;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
} {
  return {
    id: 'video-1',
    channelId: 'channel-1',
    title: 'Video',
    description: 'Description',
    category: 'music',
    tags: ['action'],
    status: VideoStatus.READY,
    price: 0,
    requiredTierLevel: null,
    thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
    durationSeconds: 120,
    resolutions: ['720p'],
    errorMessage: null,
    viewCount: 10,
    publishedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  };
}

function buildChannelRow(): {
  id: string;
  name: string;
  avatarUrl: string;
} {
  return {
    id: 'channel-1',
    name: 'Cinema Labs',
    avatarUrl: 'https://cdn.example.com/channel-avatar.jpg',
  };
}

function buildMembershipTier(): {
  id: string;
  channelId: string;
  name: string;
  level: number;
  priceCoin: number;
  isAcceptingNew: boolean;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: 'tier-1',
    channelId: 'channel-1',
    name: 'Supporter',
    level: 1,
    priceCoin: 100,
    isAcceptingNew: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };
}

function buildCachedMembershipTier(): {
  id: string;
  channelId: string;
  name: string;
  level: number;
  priceCoin: number;
  isAcceptingNew: boolean;
  createdAt: string;
  updatedAt: string;
} {
  return {
    ...buildMembershipTier(),
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  };
}

function buildCategory(): Category {
  return new Category({
    id: 'category-1',
    name: 'Music',
    slug: 'music',
    description: null,
    status: CategoryStatus.ACTIVE,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  });
}

function buildTag(): Tag {
  return new Tag({
    id: 'tag-1',
    name: 'Action',
    slug: 'action',
    status: TagStatus.ACTIVE,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  });
}
