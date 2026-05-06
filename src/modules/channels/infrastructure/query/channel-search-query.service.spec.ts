import { ChannelStatus } from '../../domain/entities/channel.entity';
import { ChannelSearchQueryService } from './channel-search-query.service';

describe('ChannelSearchQueryService', () => {
  const getMany = jest.fn();
  const queryBuilder = {
    where: jest.fn(),
    andWhere: jest.fn(),
    addSelect: jest.fn(),
    setParameters: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    take: jest.fn(),
    getMany,
  };
  const channelOrmRepository = {
    createQueryBuilder: jest.fn(() => queryBuilder),
  };
  const cacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const service = new ChannelSearchQueryService(
    channelOrmRepository as never,
    cacheService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    queryBuilder.where.mockReturnValue(queryBuilder);
    queryBuilder.andWhere.mockReturnValue(queryBuilder);
    queryBuilder.addSelect.mockReturnValue(queryBuilder);
    queryBuilder.setParameters.mockReturnValue(queryBuilder);
    queryBuilder.orderBy.mockReturnValue(queryBuilder);
    queryBuilder.addOrderBy.mockReturnValue(queryBuilder);
    queryBuilder.take.mockReturnValue(queryBuilder);
  });

  it('returns cached channel results without querying database', async () => {
    cacheService.get.mockResolvedValue([
      {
        id: 'channel-1',
        userId: 'user-1',
        name: 'Piano Hub',
        bio: 'All about piano',
        avatarUrl: '',
        bannerUrl: '',
        status: 'active',
        isEligibleForMembership: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    ]);

    await expect(
      service.searchChannels({ q: 'piano', limit: 20 }),
    ).resolves.toEqual([
      {
        id: 'channel-1',
        userId: 'user-1',
        name: 'Piano Hub',
        bio: 'All about piano',
        avatarUrl: '',
        bannerUrl: '',
        status: 'active',
        isEligibleForMembership: false,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);
    expect(channelOrmRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('queries active channels and caches mapped results', async () => {
    cacheService.get.mockResolvedValue(null);
    getMany.mockResolvedValue([
      {
        id: 'channel-1',
        userId: 'user-1',
        name: 'Piano Hub',
        bio: 'All about piano',
        avatarUrl: '',
        bannerUrl: '',
        status: ChannelStatus.ACTIVE,
        isEligibleForMembership: false,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);

    await service.searchChannels({ q: 'piano', limit: 20 });

    expect(queryBuilder.where).toHaveBeenCalledWith('channel.status = :status', {
      status: ChannelStatus.ACTIVE,
    });
    expect(queryBuilder.take).toHaveBeenCalledWith(20);
    expect(cacheService.set).toHaveBeenCalledWith(
      'media_service:search:global:q:piano:limit:20:channels',
      [
        {
          id: 'channel-1',
          userId: 'user-1',
          name: 'Piano Hub',
          bio: 'All about piano',
          avatarUrl: '',
          bannerUrl: '',
          status: ChannelStatus.ACTIVE,
          isEligibleForMembership: false,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      60,
    );
  });

  it('falls back to database when cache read fails', async () => {
    cacheService.get.mockRejectedValue(new Error('redis down'));
    getMany.mockResolvedValue([]);

    await expect(
      service.searchChannels({ q: 'piano', limit: 20 }),
    ).resolves.toEqual([]);
    expect(channelOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
      'channel',
    );
  });
});
