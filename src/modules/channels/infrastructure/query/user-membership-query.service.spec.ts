import { ChannelMembershipStatus } from '../../domain/entities/channel-membership.entity';
import { UserMembershipQueryService } from './user-membership-query.service';

describe('UserMembershipQueryService', () => {
  const getRawMany = jest.fn();
  const getCount = jest.fn();
  const clone = jest.fn();
  const queryBuilder = {
    innerJoin: jest.fn(),
    where: jest.fn(),
    select: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getRawMany,
    clone,
  };
  const countQueryBuilder = {
    getCount,
  };
  const membershipOrmRepository = {
    createQueryBuilder: jest.fn(() => queryBuilder),
  };

  const service = new UserMembershipQueryService(
    membershipOrmRepository as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    queryBuilder.innerJoin.mockReturnValue(queryBuilder);
    queryBuilder.where.mockReturnValue(queryBuilder);
    queryBuilder.select.mockReturnValue(queryBuilder);
    queryBuilder.orderBy.mockReturnValue(queryBuilder);
    queryBuilder.addOrderBy.mockReturnValue(queryBuilder);
    queryBuilder.skip.mockReturnValue(queryBuilder);
    queryBuilder.take.mockReturnValue(queryBuilder);
    clone.mockReturnValue(countQueryBuilder);
  });

  it('queries memberships with joins, ordering, and pagination', async () => {
    getRawMany.mockResolvedValue([
      {
        membership_id: 'membership-1',
        channel_id: 'channel-1',
        channel_name: 'Channel',
        channel_avatar_url: '',
        tier_id: 'tier-1',
        tier_name: 'Gold',
        tier_level: '2',
        price_coin: '300',
        started_at: '2026-01-01T00:00:00.000Z',
        expiry_date: '2099-01-01T00:00:00.000Z',
        status: ChannelMembershipStatus.ACTIVE,
        is_membership_closed_by_admin: true,
      },
    ]);
    getCount.mockResolvedValue(1);

    await expect(
      service.getMembershipsByUserId({ userId: 'user-1', page: 2, limit: 10 }),
    ).resolves.toEqual({
      items: [
        {
          membershipId: 'membership-1',
          channelId: 'channel-1',
          channelName: 'Channel',
          channelAvatarUrl: null,
          tierId: 'tier-1',
          tierName: 'Gold',
          tierLevel: 2,
          priceCoin: 300,
          startedAt: new Date('2026-01-01T00:00:00.000Z'),
          expiryDate: new Date('2099-01-01T00:00:00.000Z'),
          status: ChannelMembershipStatus.ACTIVE,
          isMembershipClosedByAdmin: true,
        },
      ],
      total: 1,
    });

    expect(membershipOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
      'membership',
    );
    expect(queryBuilder.where).toHaveBeenCalledWith(
      'membership.userId = :userId',
      { userId: 'user-1' },
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      'membership.updatedAt',
      'DESC',
    );
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
      'membership.createdAt',
      'DESC',
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(10);
    expect(queryBuilder.take).toHaveBeenCalledWith(10);
    expect(clone).toHaveBeenCalled();
  });
});
