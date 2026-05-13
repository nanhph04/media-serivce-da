import { VideoRepository } from './video.repository';

describe('VideoRepository', () => {
  const execute = jest.fn();
  const where = jest.fn();
  const addSelect = jest.fn();
  const getRawOne = jest.fn();
  const setParameter = jest.fn();
  const set = jest.fn();
  const update = jest.fn();
  const createQueryBuilder = jest.fn();
  const findOne = jest.fn();
  const find = jest.fn();
  const ormRepository = {
    createQueryBuilder,
    find,
    findOne,
  };
  const manager = {
    delete: jest.fn(),
  };
  const dataSource = {
    transaction: jest.fn(
      async (callback: (managerArg: typeof manager) => void) =>
        callback(manager),
    ),
  };

  const repository = new VideoRepository(
    ormRepository as never,
    dataSource as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    execute.mockResolvedValue(undefined);
    where.mockReturnValue({ execute });
    set.mockReturnValue({ where });
    update.mockReturnValue({ set });
    createQueryBuilder.mockReturnValue({ update });
    addSelect.mockReturnValue({
      where,
    });
    where.mockReturnValue({
      execute,
      setParameter,
    });
    setParameter.mockReturnValue({
      getRawOne,
    });
    manager.delete.mockResolvedValue(undefined);
  });

  it('increments view_count atomically for the target video', async () => {
    await repository.incrementViewCount('video-1');

    expect(update).toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith({
      viewCount: expect.any(Function),
      updatedAt: expect.any(Function),
    });
    expect(where).toHaveBeenCalledWith('id = :videoId', {
      videoId: 'video-1',
    });
    expect(execute).toHaveBeenCalledTimes(1);

    const setArg = set.mock.calls[0][0] as {
      viewCount: () => string;
      updatedAt: () => string;
    };
    expect(setArg.viewCount()).toBe('"view_count" + 1');
    expect(setArg.updatedAt()).toBe('CURRENT_TIMESTAMP');
  });

  it('increments view_count by an arbitrary delta', async () => {
    await repository.incrementViewCountBy('video-1', 7);

    const setArg = set.mock.calls[0][0] as {
      viewCount: () => string;
    };
    expect(setArg.viewCount()).toBe('"view_count" + 7');
  });

  it('loads basic video data without joining category relations', async () => {
    findOne.mockResolvedValue({
      id: 'video-1',
      channelId: 'channel-1',
      ownerId: 'owner-1',
      title: 'Video',
      description: 'Description',
      visibility: 'public',
      status: 'ready',
      price: 0,
      requiredTierLevel: null,
      rawFileKey: 'raw/video.mp4',
      masterPlaylistKey: 'processed/master.m3u8',
      thumbnailUrl: null,
      durationSeconds: 120,
      resolutions: ['720p'],
      errorMessage: null,
      viewCount: 0,
      publishedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      category: buildCategoryRow(),
      videoTags: [],
    });

    const video = await repository.findBasicById('video-1');

    expect(findOne).toHaveBeenCalledWith({
      where: { id: 'video-1' },
      relations: { category: true, videoTags: { tag: true } },
    });
    expect(video?.category.slug).toBe('music');
  });

  it('aggregates ready video count and total views for channel eligibility', async () => {
    const select = jest.fn().mockReturnValue({ addSelect });
    addSelect.mockReturnValue({ where });
    where.mockReturnValue({ setParameter });
    setParameter.mockReturnValue({ getRawOne });
    getRawOne.mockResolvedValue({
      readyVideoCount: '5',
      totalVideoViews: '1000',
    });
    createQueryBuilder.mockReturnValue({ select });

    await expect(
      repository.getChannelMembershipEligibilityMetrics('channel-1'),
    ).resolves.toEqual({
      readyVideoCount: 5,
      totalVideoViews: 1000,
    });
  });

  it('loads studio videos by owner with optional visibility and status filters', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const updatedAt = new Date('2026-01-02T00:00:00.000Z');
    find.mockResolvedValue([
      {
        id: 'video-1',
        channelId: 'channel-1',
        ownerId: 'owner-1',
        title: 'Video',
        description: 'Description',
        visibility: 'private',
        status: 'draft',
        price: 0,
        requiredTierLevel: null,
        rawFileKey: 'raw/video.mp4',
        masterPlaylistKey: null,
        thumbnailUrl: null,
        durationSeconds: null,
        resolutions: [],
        errorMessage: null,
        viewCount: 0,
        publishedAt: null,
        createdAt,
        updatedAt,
        category: buildCategoryRow(),
        videoTags: [],
      },
    ]);

    const videos = await repository.findStudioByOwnerId('owner-1', {
      limit: 10,
      statuses: ['draft'],
      visibilities: ['private'],
    });

    expect(find).toHaveBeenCalledWith({
      where: {
        ownerId: 'owner-1',
        status: expect.any(Object),
        visibility: expect.any(Object),
      },
      relations: { category: true, videoTags: { tag: true } },
      order: {
        updatedAt: 'DESC',
        createdAt: 'DESC',
      },
      take: 10,
    });
    expect(videos[0]?.ownerId).toBe('owner-1');
  });

  it('deletes only draft videos by id', async () => {
    await repository.deleteDraftById('video-1');

    expect(manager.delete).toHaveBeenCalledWith(expect.any(Function), {
      videoId: 'video-1',
    });
    expect(manager.delete).toHaveBeenCalledWith(expect.any(Function), {
      id: 'video-1',
      status: 'draft',
    });
  });

  it('loads expired drafts ordered by creation time', async () => {
    find.mockResolvedValue([]);
    const cutoffDate = new Date('2026-01-01T00:00:00.000Z');

    await repository.findExpiredDrafts(cutoffDate, 25);

    expect(find).toHaveBeenCalledWith({
      where: {
        status: 'draft',
        createdAt: expect.any(Object),
      },
      relations: { category: true, videoTags: { tag: true } },
      order: {
        createdAt: 'ASC',
      },
      take: 25,
    });
  });

  it('loads stale videos by status using statusChangedAt', async () => {
    find.mockResolvedValue([]);
    const cutoffDate = new Date('2026-01-01T00:00:00.000Z');

    await repository.findStaleByStatus('processing', cutoffDate, 50);

    expect(find).toHaveBeenCalledWith({
      where: {
        status: 'processing',
        statusChangedAt: expect.any(Object),
      },
      relations: { category: true, videoTags: { tag: true } },
      order: {
        statusChangedAt: 'ASC',
      },
      take: 50,
    });
  });
});

function buildCategoryRow(): {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  status: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: 'category-1',
    name: 'Music',
    slug: 'music',
    description: null,
    parentId: null,
    status: 'active',
    displayOrder: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };
}
