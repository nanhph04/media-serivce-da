/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { VideoRepository } from './video.repository';
import {
  VideoStatus,
  VideoThumbnailSource,
  VideoThumbnailStatus,
  VideoVisibility,
  type VideoEntity,
} from '../../domain/entities/video.entity';
import { VideoOrmEntity } from './video.orm-entity';
import { VideoTagOrmEntity } from './video-tag.orm-entity';

describe('VideoRepository', () => {
  const execute = jest.fn();
  const where = jest.fn();
  const addSelect = jest.fn();
  const getRawOne = jest.fn();
  const setParameter = jest.fn();
  const set = jest.fn();
  const update = jest.fn();
  const createQueryBuilder = jest.fn();
  const managerCreateQueryBuilder = jest.fn();
  const findOne = jest.fn();
  const find = jest.fn();
  const findAndCount = jest.fn();
  const ormRepository = {
    createQueryBuilder,
    find,
    findAndCount,
    findOne,
    manager: {
      createQueryBuilder: managerCreateQueryBuilder,
    },
  };
  const manager = {
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    insert: jest.fn(),
  };
  const dataSource = {
    transaction: jest.fn((callback: (managerArg: typeof manager) => unknown) =>
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
    managerCreateQueryBuilder.mockReset();
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
    manager.save.mockResolvedValue(undefined);
    manager.update.mockResolvedValue({ affected: 1 });
    manager.delete.mockResolvedValue(undefined);
    manager.insert.mockResolvedValue(undefined);
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

  it('conditionally saves a video only when current status matches', async () => {
    const video = buildRepositoryVideo(VideoStatus.REJECTED);

    await expect(
      repository.saveIfStatus(video, VideoStatus.PENDING_MANUAL_REVIEW),
    ).resolves.toBe(true);

    expect(manager.update).toHaveBeenCalledWith(
      VideoOrmEntity,
      { id: 'video-1', status: VideoStatus.PENDING_MANUAL_REVIEW },
      expect.objectContaining({ status: VideoStatus.REJECTED }),
    );
    expect(manager.delete).toHaveBeenCalledWith(VideoTagOrmEntity, {
      videoId: 'video-1',
    });
  });

  it('skips tag writes when conditional video save misses', async () => {
    manager.update.mockResolvedValueOnce({ affected: 0 });
    const video = buildRepositoryVideo(VideoStatus.REJECTED);

    await expect(
      repository.saveIfStatus(video, VideoStatus.PENDING_MANUAL_REVIEW),
    ).resolves.toBe(false);

    expect(manager.delete).not.toHaveBeenCalled();
    expect(manager.insert).not.toHaveBeenCalled();
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
    findAndCount.mockResolvedValue([
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
          viewCount: 0,
          publishedAt: null,
          createdAt,
          updatedAt,
          category: buildCategoryRow(),
          videoTags: [],
        },
      ],
      1,
    ]);

    const result = await repository.findStudioByOwnerId('owner-1', {
      page: 2,
      limit: 10,
      statuses: ['draft'],
      visibilities: ['private'],
    });

    expect(findAndCount).toHaveBeenCalledWith({
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
      skip: 10,
      take: 10,
    });
    expect(result.items[0]?.ownerId).toBe('owner-1');
    expect(result.total).toBe(1);
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

  it('aggregates admin video summary for the selected period', async () => {
    const queryBuilder = {
      addSelect: jest.fn(),
      getRawOne: jest.fn().mockResolvedValue({
        totalVideos: '10',
        newVideos: '3',
        readyVideos: '4',
        uploadingVideos: '2',
        pendingManualReviewVideos: '1',
        rejectedVideos: '1',
        failedVideos: '1',
        bannedVideos: '1',
        totalViews: '1234',
      }),
      select: jest.fn(),
      setParameters: jest.fn(),
    };
    const viewQueryBuilder = {
      getRawOne: jest.fn().mockResolvedValue({ newViews: '321' }),
      select: jest.fn(),
      where: jest.fn(),
    };
    const purchaseQueryBuilder = {
      getRawOne: jest.fn().mockResolvedValue({ newPurchases: '12' }),
      select: jest.fn(),
      where: jest.fn(),
    };
    queryBuilder.select.mockReturnValue(queryBuilder);
    queryBuilder.addSelect.mockReturnValue(queryBuilder);
    queryBuilder.setParameters.mockReturnValue(queryBuilder);
    viewQueryBuilder.select.mockReturnValue(viewQueryBuilder);
    viewQueryBuilder.where.mockReturnValue(viewQueryBuilder);
    purchaseQueryBuilder.select.mockReturnValue(purchaseQueryBuilder);
    purchaseQueryBuilder.where.mockReturnValue(purchaseQueryBuilder);
    createQueryBuilder.mockReturnValue(queryBuilder);
    managerCreateQueryBuilder
      .mockReturnValueOnce(viewQueryBuilder)
      .mockReturnValueOnce(purchaseQueryBuilder);

    await expect(repository.getAdminVideoSummary('week')).resolves.toEqual({
      period: 'week',
      totalVideos: 10,
      readyVideos: 4,
      uploadingVideos: 2,
      pendingManualReviewVideos: 1,
      rejectedVideos: 1,
      failedVideos: 1,
      bannedVideos: 1,
      totalViews: 1234,
      newVideos: 3,
      newViews: 321,
      newPurchases: 12,
    });
    expect(queryBuilder.select).toHaveBeenCalledWith('COUNT(*)', 'totalVideos');
    expect(queryBuilder.addSelect).toHaveBeenCalledWith(
      'COALESCE(SUM(video.viewCount), 0)',
      'totalViews',
    );
    expect(queryBuilder.setParameters).toHaveBeenCalledWith(
      expect.objectContaining({
        uploadingStatuses: [
          VideoStatus.DRAFT,
          VideoStatus.PENDING_MODERATION,
          VideoStatus.PROCESSING,
        ],
      }),
    );
    expect(viewQueryBuilder.where).toHaveBeenCalledWith(
      'stat.stat_date >= :periodStartDate',
      expect.objectContaining({
        periodStartDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/u),
      }),
    );
    expect(purchaseQueryBuilder.where).toHaveBeenCalledWith(
      'unlock.created_at >= :periodStartDate',
      expect.objectContaining({ periodStartDate: expect.any(Date) }),
    );
  });

  it('aggregates all-time admin video summary without period filters', async () => {
    const queryBuilder = {
      addSelect: jest.fn(),
      getRawOne: jest.fn().mockResolvedValue({
        totalVideos: '10',
        newVideos: '10',
        readyVideos: '4',
        uploadingVideos: '2',
        pendingManualReviewVideos: '1',
        rejectedVideos: '1',
        failedVideos: '1',
        bannedVideos: '1',
        totalViews: '1234',
      }),
      select: jest.fn(),
      setParameters: jest.fn(),
    };
    const viewQueryBuilder = {
      getRawOne: jest.fn().mockResolvedValue({ newViews: '1234' }),
      select: jest.fn(),
      where: jest.fn(),
    };
    const purchaseQueryBuilder = {
      getRawOne: jest.fn().mockResolvedValue({ newPurchases: '25' }),
      select: jest.fn(),
      where: jest.fn(),
    };
    queryBuilder.select.mockReturnValue(queryBuilder);
    queryBuilder.addSelect.mockReturnValue(queryBuilder);
    queryBuilder.setParameters.mockReturnValue(queryBuilder);
    viewQueryBuilder.select.mockReturnValue(viewQueryBuilder);
    purchaseQueryBuilder.select.mockReturnValue(purchaseQueryBuilder);
    createQueryBuilder.mockReturnValue(queryBuilder);
    managerCreateQueryBuilder
      .mockReturnValueOnce(viewQueryBuilder)
      .mockReturnValueOnce(purchaseQueryBuilder);

    await expect(repository.getAdminVideoSummary('all')).resolves.toEqual({
      period: 'all',
      totalVideos: 10,
      readyVideos: 4,
      uploadingVideos: 2,
      pendingManualReviewVideos: 1,
      rejectedVideos: 1,
      failedVideos: 1,
      bannedVideos: 1,
      totalViews: 1234,
      newVideos: 10,
      newViews: 1234,
      newPurchases: 25,
    });
    expect(viewQueryBuilder.where).not.toHaveBeenCalled();
    expect(purchaseQueryBuilder.where).not.toHaveBeenCalled();
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
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      'video.updatedAt',
      'DESC',
    );
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
      'video.createdAt',
      'DESC',
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(5);
    expect(queryBuilder.take).toHaveBeenCalledWith(5);
    expect(result.total).toBe(1);
    expect(result.items[0]?.id).toBe('video-1');
  });

  it('finds admin video detail by id', async () => {
    const leftJoinAndSelect = jest.fn();
    const queryWhere = jest.fn();
    const getOne = jest.fn().mockResolvedValue(buildVideoRow());
    const queryBuilder = {
      getOne,
      leftJoinAndSelect,
      where: queryWhere,
    };
    leftJoinAndSelect.mockReturnValue(queryBuilder);
    queryWhere.mockReturnValue(queryBuilder);
    createQueryBuilder.mockReturnValue(queryBuilder);

    const result = await repository.findAdminVideoById('video-1');

    expect(createQueryBuilder).toHaveBeenCalledWith('video');
    expect(queryWhere).toHaveBeenCalledWith('video.id = :id', {
      id: 'video-1',
    });
    expect(result?.id).toBe('video-1');
  });
});

function buildVideoRow(): {
  id: string;
  channelId: string;
  ownerId: string;
  title: string;
  description: string;
  visibility: string;
  status: string;
  price: number;
  requiredTierLevel: null;
  rawFileKey: string;
  masterPlaylistKey: null;
  thumbnailUrl: null;
  durationSeconds: null;
  resolutions: string[];
  errorMessage: null;
  moderationDetails: null;
  viewCount: number;
  publishedAt: null;
  isDeleted: boolean;
  deletedAt: null;
  deletedBy: null;
  deleteReason: null;
  deletionStatus: string;
  deleteRequestedAt: null;
  refundCompletedAt: null;
  refundSummary: null;
  createdAt: Date;
  updatedAt: Date;
  statusChangedAt: Date;
  category: ReturnType<typeof buildCategoryRow>;
  videoTags: [];
} {
  return {
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
    isDeleted: true,
    deletedAt: null,
    deletedBy: null,
    deleteReason: null,
    deletionStatus: 'active',
    deleteRequestedAt: null,
    refundCompletedAt: null,
    refundSummary: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    statusChangedAt: new Date('2026-01-02T00:00:00.000Z'),
    category: buildCategoryRow(),
    videoTags: [],
  };
}

function buildRepositoryVideo(status: VideoStatus): VideoEntity {
  return {
    id: 'video-1',
    channelId: 'channel-1',
    ownerId: 'owner-1',
    title: 'Video',
    description: 'Description',
    category: { id: 'category-1' },
    tags: [],
    visibility: VideoVisibility.PUBLIC,
    status,
    price: 0,
    requiredTierLevel: null,
    rawFileKey: 'raw/video.mp4',
    masterPlaylistKey: null,
    thumbnailObjectKey: null,
    thumbnailUrl: null,
    thumbnailSource: VideoThumbnailSource.AUTO,
    thumbnailStatus: VideoThumbnailStatus.PROCESSING,
    thumbnailGeneratedAt: null,
    thumbnailError: null,
    durationSeconds: null,
    resolutions: ['720p'],
    processingWarnings: [],
    errorMessage: status === VideoStatus.REJECTED ? 'Policy issue' : null,
    moderationDetails:
      status === VideoStatus.REJECTED
        ? {
            reason: 'Policy issue',
            confidence: 1,
            evidenceTimestampSeconds: null,
          }
        : null,
    viewCount: 0,
    publishedAt: null,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    deleteReason: null,
    deletionStatus: 'active',
    deleteRequestedAt: null,
    refundCompletedAt: null,
    refundSummary: null,
    storageDeletedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    statusChangedAt: new Date('2026-01-02T00:00:00.000Z'),
  } as unknown as VideoEntity;
}

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
