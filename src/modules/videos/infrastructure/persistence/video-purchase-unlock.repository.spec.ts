import { Category } from '../../../categories/domain/entities/category.entity';
import { CategoryStatus } from '../../../categories/domain/entities/category.entity';
import {
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { VideoPurchaseUnlockRepository } from './video-purchase-unlock.repository';

describe('VideoPurchaseUnlockRepository', () => {
  const count = jest.fn();
  const save = jest.fn();
  const innerJoinAndSelect = jest.fn();
  const leftJoinAndSelect = jest.fn();
  const where = jest.fn();
  const andWhere = jest.fn();
  const orderBy = jest.fn();
  const addOrderBy = jest.fn();
  const offset = jest.fn();
  const limit = jest.fn();
  const pageSelect = jest.fn();
  const pageAddSelect = jest.fn();
  const pageOrderBy = jest.fn();
  const pageAddOrderBy = jest.fn();
  const groupBy = jest.fn();
  const addGroupBy = jest.fn();
  const countSelect = jest.fn();
  const countOrderBy = jest.fn();
  const getRawMany = jest.fn();
  const getRawOne = jest.fn();
  const clone = jest.fn();
  const videoWhere = jest.fn();
  const videoLeftJoinAndSelect = jest.fn();
  const videoGetMany = jest.fn();
  const createQueryBuilder = jest.fn();
  const queryBuilder = {
    where,
    andWhere,
    orderBy,
    addOrderBy,
    clone,
  };
  const clonedPageQueryBuilder = {
    select: pageSelect,
    addSelect: pageAddSelect,
    groupBy,
    addGroupBy,
    orderBy: pageOrderBy,
    addOrderBy: pageAddOrderBy,
    offset,
    limit,
    getRawMany,
  };
  const clonedCountQueryBuilder = {
    orderBy: countOrderBy,
    select: countSelect,
    getRawOne,
  };
  const videoQueryBuilder = {
    leftJoinAndSelect: videoLeftJoinAndSelect,
    where: videoWhere,
    getMany: videoGetMany,
  };
  const manager = {
    createQueryBuilder,
  };
  const ormRepository = {
    count,
    save,
    manager,
  };
  const repository = new VideoPurchaseUnlockRepository(ormRepository as never);

  beforeEach(() => {
    jest.clearAllMocks();
    createQueryBuilder.mockReset();
    clone.mockReset();
    createQueryBuilder
      .mockReturnValueOnce({ innerJoin: innerJoinAndSelect })
      .mockReturnValueOnce(videoQueryBuilder);
    innerJoinAndSelect.mockReturnValue(queryBuilder);
    where.mockReturnValue(queryBuilder);
    andWhere.mockReturnValue(queryBuilder);
    orderBy.mockReturnValue(queryBuilder);
    addOrderBy.mockReturnValue(queryBuilder);
    offset.mockReturnValue(clonedPageQueryBuilder);
    limit.mockReturnValue(clonedPageQueryBuilder);
    pageSelect.mockReturnValue(clonedPageQueryBuilder);
    pageAddSelect.mockReturnValue(clonedPageQueryBuilder);
    groupBy.mockReturnValue(clonedPageQueryBuilder);
    addGroupBy.mockReturnValue(clonedPageQueryBuilder);
    pageOrderBy.mockReturnValue(clonedPageQueryBuilder);
    pageAddOrderBy.mockReturnValue(clonedPageQueryBuilder);
    countSelect.mockReturnValue(clonedCountQueryBuilder);
    countOrderBy.mockReturnValue(clonedCountQueryBuilder);
    clone
      .mockReturnValueOnce(clonedPageQueryBuilder)
      .mockReturnValueOnce(clonedCountQueryBuilder);
    videoLeftJoinAndSelect.mockReturnValue(videoQueryBuilder);
    videoWhere.mockReturnValue(videoQueryBuilder);
  });

  it('returns purchased ready videos paged by newest unlock first', async () => {
    getRawMany.mockResolvedValue([{ videoId: 'video-1' }]);
    getRawOne.mockResolvedValue({ total: '21' });
    videoGetMany.mockResolvedValue([
      buildVideoRow({
        id: 'video-1',
        title: 'Premium Video',
        status: VideoStatus.READY,
        price: 500,
      }),
    ]);

    const result = await repository.findPurchasedByUserId({
      userId: 'viewer-1',
      page: 2,
      limit: 10,
    });

    expect(where).toHaveBeenCalledWith('unlock.user_id = :userId', {
      userId: 'viewer-1',
    });
    expect(andWhere).toHaveBeenCalledWith('video.status = :status', {
      status: VideoStatus.READY,
    });
    expect(andWhere).toHaveBeenCalledWith('video.price > 0');
    expect(pageOrderBy).toHaveBeenCalledWith(
      'MAX(unlock.created_at)',
      'DESC',
    );
    expect(pageAddOrderBy).toHaveBeenCalledWith('video.created_at', 'DESC');
    expect(offset).toHaveBeenCalledWith(10);
    expect(limit).toHaveBeenCalledWith(10);
    expect(clone).toHaveBeenCalled();
    expect(videoWhere).toHaveBeenCalledWith('video.id IN (:...videoIds)', {
      videoIds: ['video-1'],
    });
    expect(result.total).toBe(21);
    expect(result.items[0]).toMatchObject({
      id: 'video-1',
      title: 'Premium Video',
      status: VideoStatus.READY,
      price: 500,
    });
    expect(result.items[0]?.category.slug).toBe('music');
  });

  it('returns an empty page when the user has no purchased videos', async () => {
    getRawMany.mockResolvedValue([]);
    getRawOne.mockResolvedValue({ total: '0' });

    await expect(
      repository.findPurchasedByUserId({
        userId: 'viewer-1',
        page: 1,
        limit: 20,
      }),
    ).resolves.toEqual({
      items: [],
      total: 0,
    });
    expect(videoWhere).not.toHaveBeenCalled();
  });
});

function buildVideoRow(
  overrides: Partial<{
    id: string;
    title: string;
    status: VideoStatus;
    price: number;
  }> = {},
): {
  id: string;
  channelId: string;
  ownerId: string;
  title: string;
  description: string;
  visibility: VideoVisibility;
  status: VideoStatus;
  price: number;
  requiredTierLevel: number | null;
  rawFileKey: string;
  masterPlaylistKey: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  resolutions: string[];
  errorMessage: string | null;
  viewCount: number;
  publishedAt: Date | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: string | null;
  deleteReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  videoCategories: {
    category: Category;
  }[];
  category: Category;
  videoTags: [];
} {
  return {
    id: overrides.id ?? 'video-1',
    channelId: 'channel-1',
    ownerId: 'owner-1',
    title: overrides.title ?? 'Video',
    description: 'Description',
    visibility: VideoVisibility.PRIVATE,
    status: overrides.status ?? VideoStatus.READY,
    price: overrides.price ?? 500,
    requiredTierLevel: null,
    rawFileKey: 'raw/video.mp4',
    masterPlaylistKey: 'processed/master.m3u8',
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
    category: new Category({
      id: 'category-1',
      name: 'Music',
      slug: 'music',
      description: null,
      status: CategoryStatus.ACTIVE,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    }),
    videoTags: [],
    videoCategories: [
      {
        category: new Category({
          id: 'category-1',
          name: 'Music',
          slug: 'music',
          description: null,
          status: CategoryStatus.ACTIVE,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        }),
      },
    ],
  };
}
