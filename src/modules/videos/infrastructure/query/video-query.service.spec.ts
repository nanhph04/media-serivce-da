import { NotFoundException } from '@shared/domain/exceptions/domain.exception';
import { Category, CategoryStatus } from '../../../categories/domain/entities/category.entity';
import {
  VideoEntity,
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import {
  VIDEO_CACHE_KEYS,
  VIDEO_CACHE_TTL_SECONDS,
} from '../cache.constants';
import { VideoQueryService } from './video-query.service';

describe('VideoQueryService', () => {
  const videoRepository = {
    findBasicById: jest.fn(),
    findById: jest.fn(),
    findPublicByChannelId: jest.fn(),
    findLatestPublic: jest.fn(),
    findByCategory: jest.fn(),
  };
  const createQueryBuilder = jest.fn();
  const watchProgressOrmRepository = {
    createQueryBuilder,
  };
  const cacheService = {
    get: jest.fn(),
    set: jest.fn(),
    getKeys: jest.fn(),
  };
  const service = new VideoQueryService(
    videoRepository as never,
    watchProgressOrmRepository as never,
    cacheService as never,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns metadata from cache without querying database', async () => {
    cacheService.get.mockResolvedValue({
      id: 'video-1',
      title: 'Cached Video',
      description: 'Cached description',
      thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
      viewCount: 7,
      status: VideoStatus.READY,
      visibility: VideoVisibility.PUBLIC,
      publishedAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    });

    const result = await service.getVideoMetadata('video-1');

    expect(result).toEqual({
      id: 'video-1',
      title: 'Cached Video',
      description: 'Cached description',
      thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
      viewCount: 7,
      status: VideoStatus.READY,
      visibility: VideoVisibility.PUBLIC,
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    expect(videoRepository.findBasicById).not.toHaveBeenCalled();
  });

  it('caches metadata on cache miss', async () => {
    cacheService.get.mockResolvedValue(null);
    videoRepository.findBasicById.mockResolvedValue(buildVideo());

    await expect(service.getVideoMetadata('video-1')).resolves.toEqual({
      id: 'video-1',
      title: 'Video',
      description: 'Description',
      thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
      viewCount: 10,
      status: VideoStatus.READY,
      visibility: VideoVisibility.PUBLIC,
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    expect(cacheService.set).toHaveBeenCalledWith(
      VIDEO_CACHE_KEYS.metadata('video-1'),
      {
        id: 'video-1',
        title: 'Video',
        description: 'Description',
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        viewCount: 10,
        status: VideoStatus.READY,
        visibility: VideoVisibility.PUBLIC,
        publishedAt: '2026-01-01T00:00:00.000Z',
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

    await expect(service.getVideoMetadata('video-1')).resolves.toMatchObject({
      id: 'video-1',
    });
    expect(videoRepository.findBasicById).toHaveBeenCalledWith('video-1');
  });

  it('returns database metadata when cache set fails', async () => {
    cacheService.get.mockResolvedValue(null);
    cacheService.set.mockRejectedValue(new Error('redis unavailable'));
    videoRepository.findBasicById.mockResolvedValue(buildVideo());

    await expect(service.getVideoMetadata('video-1')).resolves.toMatchObject({
      id: 'video-1',
    });
  });

  it('returns latest videos from cache without querying database', async () => {
    cacheService.get
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce([buildCachedListItem()]);

    const result = await service.getLatestVideos(20);

    expect(result[0].createdAt).toEqual(
      new Date('2026-01-01T00:00:00.000Z'),
    );
    expect(videoRepository.findLatestPublic).not.toHaveBeenCalled();
    expect(cacheService.getKeys).not.toHaveBeenCalled();
  });

  it('caches latest videos on cache miss', async () => {
    cacheService.get
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(null);
    videoRepository.findLatestPublic.mockResolvedValue([buildVideo()]);

    await service.getLatestVideos(20);

    expect(cacheService.set).toHaveBeenCalledWith(
      VIDEO_CACHE_KEYS.latest(0, 20),
      [buildCachedListItem()],
      VIDEO_CACHE_TTL_SECONDS.discoveryList,
    );
  });

  it('caches videos by category using category and limit key', async () => {
    cacheService.get
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(null);
    videoRepository.findByCategory.mockResolvedValue([buildVideo()]);

    await service.getVideosByCategory('music', 10);

    expect(videoRepository.findByCategory).toHaveBeenCalledWith('music', 10);
    expect(cacheService.set).toHaveBeenCalledWith(
      VIDEO_CACHE_KEYS.categoryLatest(0, 'music', 10),
      [buildCachedListItem()],
      VIDEO_CACHE_TTL_SECONDS.discoveryList,
    );
    expect(cacheService.getKeys).not.toHaveBeenCalled();
  });

  it('switches to a versioned latest cache key when the version changes', async () => {
    cacheService.get
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(null);
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
    category: [
      new Category({
        id: 'category-1',
        name: 'Music',
        slug: 'music',
        description: null,
        status: CategoryStatus.ACTIVE,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      }),
    ],
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
  categories: string[];
  status: string;
  price: number;
  requiredTierLevel: number | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  resolutions: string[];
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
    categories: ['music'],
    status: VideoStatus.READY,
    price: 0,
    requiredTierLevel: null,
    thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
    durationSeconds: 120,
    resolutions: ['720p'],
    viewCount: 10,
    publishedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  };
}
