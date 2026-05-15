import { ChannelRepositoryImpl } from './channel.repository.impl';

describe('ChannelRepositoryImpl', () => {
  it('aggregates admin channel counts', async () => {
    const queryBuilder = {
      addSelect: jest.fn(),
      getRawOne: jest.fn().mockResolvedValue({
        totalChannels: '10',
        eligibleForMembership: '4',
        membershipClosedByAdmin: '2',
      }),
      select: jest.fn(),
    };
    queryBuilder.select.mockReturnValue(queryBuilder);
    queryBuilder.addSelect.mockReturnValue(queryBuilder);
    const ormRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const repository = new ChannelRepositoryImpl(ormRepository as never);

    await expect(repository.getAdminChannelCounts()).resolves.toEqual({
      totalChannels: 10,
      eligibleForMembership: 4,
      membershipClosedByAdmin: 2,
    });
    expect(ormRepository.createQueryBuilder).toHaveBeenCalledWith('channel');
  });
});
