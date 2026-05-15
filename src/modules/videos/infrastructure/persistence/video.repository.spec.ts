/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { VideoRepository } from './video.repository';
import { VideoStatus } from '../../domain/entities/video.entity';

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
  const findAndCount = jest.fn();
  const ormRepository = {
    createQueryBuilder,
    find,
    findAndCount,
    findOne,
  };
  const manager = {
    delete: jest.fn(),
  };
  const dataSource = {
    transaction: jest.fn((callback: (managerArg: typeof manager) => void) =>
      Promise.resolve(callback(manager)),
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
        deletionStatus: 'active',
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

  it('deletes failed and rejected videos by id', async () => {
    await repository.deleteFailedById('video-1');

    expect(manager.delete).toHaveBeenCalledWith(expect.any(Function), {
      videoId: 'video-1',
    });
    expect(manager.delete).toHaveBeenCalledWith(expect.any(Function), {
      id: 'video-1',
      status: expect.objectContaining({
        _type: 'in',
        _value: ['failed', 'rejected'],
      }),
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

  it('aggregates admin channel video metrics', async () => {
    const queryBuilder = {
      addSelect: jest.fn(),
      getRawOne: jest.fn().mockResolvedValue({
        activeCreators30d: '3',
        uploadingNow: '5',
      }),
      select: jest.fn(),
      setParameters: jest.fn(),
    };
    queryBuilder.select.mockReturnValue(queryBuilder);
    queryBuilder.addSelect.mockReturnValue(queryBuilder);
    queryBuilder.setParameters.mockReturnValue(queryBuilder);
    createQueryBuilder.mockReturnValue(queryBuilder);

    await expect(
      repository.getAdminChannelVideoMetrics(
        new Date('2026-05-15T00:00:00.000Z'),
      ),
    ).resolves.toEqual({
      activeCreators30d: 3,
      uploadingNow: 5,
    });
    expect(queryBuilder.select).toHaveBeenCalledWith(
      expect.stringContaining('video.created_at'),
      'activeCreators30d',
    );
    expect(queryBuilder.select).toHaveBeenCalledWith(
      expect.stringContaining('video.channel_id'),
      'activeCreators30d',
    );
  });

  it('aggregates admin reports summary', async () => {
    const queryBuilder = {
      addSelect: jest.fn(),
      getRawOne: jest.fn().mockResolvedValue({
        pendingManualReviewVideos: '2',
        autoFlaggedVideos: '3',
        rejectedLast30d: '1',
      }),
      select: jest.fn(),
      setParameters: jest.fn(),
    };
    queryBuilder.select.mockReturnValue(queryBuilder);
    queryBuilder.addSelect.mockReturnValue(queryBuilder);
    queryBuilder.setParameters.mockReturnValue(queryBuilder);
    createQueryBuilder.mockReturnValue(queryBuilder);

    await expect(
      repository.getAdminReportsSummary(new Date('2026-05-15T00:00:00.000Z')),
    ).resolves.toEqual({
      pendingReports: 2,
      pendingManualReviewVideos: 2,
      autoFlaggedVideos: 3,
      rejectedLast30d: 1,
      averageResolutionHours: null,
    });
    expect(queryBuilder.addSelect).toHaveBeenCalledWith(
      expect.stringContaining('video.moderation_details'),
      'autoFlaggedVideos',
    );
    expect(queryBuilder.addSelect).toHaveBeenCalledWith(
      expect.stringContaining('video.status_changed_at'),
      'rejectedLast30d',
    );
  });

  it('loads admin reports ordered by oldest review first', async () => {
    findAndCount.mockResolvedValue([
      [
        {
          id: 'video-1',
          channelId: 'channel-1',
          ownerId: 'owner-1',
          title: 'Video',
          description: 'Description',
          visibility: 'public',
          status: 'pending_manual_review',
          price: 0,
          requiredTierLevel: null,
          rawFileKey: 'raw/video.mp4',
          masterPlaylistKey: null,
          thumbnailUrl: null,
          durationSeconds: null,
          resolutions: [],
          errorMessage: 'Needs review',
          moderationDetails: null,
          viewCount: 0,
          publishedAt: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-02T00:00:00.000Z'),
          statusChangedAt: new Date('2026-01-02T00:00:00.000Z'),
          category: buildCategoryRow(),
          videoTags: [],
        },
      ],
      1,
    ]);

    const result = await repository.findAdminReports({
      status: VideoStatus.PENDING_MANUAL_REVIEW,
      page: 2,
      limit: 5,
    });

    expect(findAndCount).toHaveBeenCalledWith({
      where: {
        status: 'pending_manual_review',
      },
      relations: { category: true, videoTags: { tag: true } },
      order: {
        statusChangedAt: 'ASC',
        createdAt: 'ASC',
      },
      skip: 5,
      take: 5,
    });
    expect(result.total).toBe(1);
    expect(result.items[0]?.id).toBe('video-1');
  });

  it('loads admin videos with filters, search, and pagination', async () => {
    const queryBuilder = {
      addOrderBy: jest.fn(),
      andWhere: jest.fn(),
      getManyAndCount: jest.fn().mockResolvedValue([
        [
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
            moderationDetails: null,
            viewCount: 0,
            publishedAt: null,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-02T00:00:00.000Z'),
            statusChangedAt: new Date('2026-01-02T00:00:00.000Z'),
            category: buildCategoryRow(),
            videoTags: [],
          },
        ],
        1,
      ]),
      leftJoinAndSelect: jest.fn(),
      orderBy: jest.fn(),
      skip: jest.fn(),
      take: jest.fn(),
    };
    queryBuilder.leftJoinAndSelect.mockReturnValue(queryBuilder);
    queryBuilder.andWhere.mockReturnValue(queryBuilder);
    queryBuilder.orderBy.mockReturnValue(queryBuilder);
    queryBuilder.addOrderBy.mockReturnValue(queryBuilder);
    queryBuilder.skip.mockReturnValue(queryBuilder);
    queryBuilder.take.mockReturnValue(queryBuilder);
    createQueryBuilder.mockReturnValue(queryBuilder);

    const result = await repository.findAdminVideos({
      status: VideoStatus.DRAFT,
      visibility: 'private',
      channelId: 'channel-1',
      ownerId: 'owner-1',
      q: 'Video',
      page: 2,
      limit: 5,
    });

    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'video.category',
      'category',
    );
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'video.videoTags',
      'videoTag',
    );
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'videoTag.tag',
      'tag',
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'video.status = :status',
      { status: 'draft' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'video.visibility = :visibility',
      { visibility: 'private' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'video.channelId = :channelId',
      { channelId: 'channel-1' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'video.ownerId = :ownerId',
      { ownerId: 'owner-1' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('LOWER(video.title)'),
      { partial: '%video%' },
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('video.updatedAt', 'DESC');
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
      'video.createdAt',
      'DESC',
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(5);
    expect(queryBuilder.take).toHaveBeenCalledWith(5);
    expect(result.total).toBe(1);
    expect(result.items[0]?.id).toBe('video-1');
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
