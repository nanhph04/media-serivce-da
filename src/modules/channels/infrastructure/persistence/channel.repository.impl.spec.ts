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
});
