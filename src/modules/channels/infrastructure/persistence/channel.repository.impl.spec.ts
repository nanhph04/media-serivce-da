import { ChannelRepositoryImpl } from './channel.repository.impl';

describe('ChannelRepositoryImpl', () => {
  it('aggregates admin channel counts', async () => {
    const queryBuilder = {
      addSelect: jest.fn(),
      getRawOne: jest.fn().mockResolvedValue({
        totalChannels: '10',
        eligibleForMembership: '4',
        membershipClosedByAdmin: '2',
        membershipPendingReview: '3',
        membershipApproved: '1',
        membershipRejected: '1',
      }),
      select: jest.fn(),
      setParameters: jest.fn(),
    };
    queryBuilder.select.mockReturnValue(queryBuilder);
    queryBuilder.addSelect.mockReturnValue(queryBuilder);
    queryBuilder.setParameters.mockReturnValue(queryBuilder);
    const ormRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const repository = new ChannelRepositoryImpl(ormRepository as never);

    await expect(repository.getAdminChannelCounts()).resolves.toEqual({
      totalChannels: 10,
      eligibleForMembership: 4,
      membershipClosedByAdmin: 2,
      membershipPendingReview: 3,
      membershipApproved: 1,
      membershipRejected: 1,
    });
    expect(ormRepository.createQueryBuilder).toHaveBeenCalledWith('channel');
    expect(queryBuilder.addSelect).toHaveBeenCalledWith(
      expect.stringContaining('channel.is_eligible_for_membership'),
      'eligibleForMembership',
    );
    expect(queryBuilder.addSelect).toHaveBeenCalledWith(
      expect.stringContaining('channel.is_membership_closed_by_admin'),
      'membershipClosedByAdmin',
    );
    expect(queryBuilder.addSelect).toHaveBeenCalledWith(
      expect.stringContaining('channel.membership_review_status'),
      'membershipPendingReview',
    );
  });

  it('finds admin channels with filters and pagination', async () => {
    const queryBuilder = {
      addOrderBy: jest.fn(),
      andWhere: jest.fn(),
      getManyAndCount: jest.fn().mockResolvedValue([
        [
          {
            id: 'channel-1',
            userId: 'owner-1',
            name: 'Channel',
            bio: 'Bio',
            avatarUrl: '',
            bannerUrl: '',
            status: 'active',
            isEligibleForMembership: true,
            isMembershipClosedByAdmin: false,
            membershipReviewStatus: 'approved',
            membershipRejectionReason: null,
            membershipReviewedBy: null,
            membershipReviewedAt: null,
            membershipRequestedAt: null,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-02T00:00:00.000Z'),
          },
        ],
        1,
      ]),
      orderBy: jest.fn(),
      skip: jest.fn(),
      take: jest.fn(),
    };
    queryBuilder.andWhere.mockReturnValue(queryBuilder);
    queryBuilder.orderBy.mockReturnValue(queryBuilder);
    queryBuilder.addOrderBy.mockReturnValue(queryBuilder);
    queryBuilder.skip.mockReturnValue(queryBuilder);
    queryBuilder.take.mockReturnValue(queryBuilder);
    const ormRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const repository = new ChannelRepositoryImpl(ormRepository as never);

    const result = await repository.findAdminChannels({
      page: 2,
      limit: 5,
      status: 'active' as never,
      ownerId: 'owner-1',
      q: 'Music',
    });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'channel.status = :status',
      { status: 'active' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'channel.userId = :ownerId',
      { ownerId: 'owner-1' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('LOWER(channel.name)'),
      { partial: '%music%' },
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(5);
    expect(queryBuilder.take).toHaveBeenCalledWith(5);
    expect(result.total).toBe(1);
    expect(result.items[0]?.id).toBe('channel-1');
  });
});
