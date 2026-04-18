import { MembershipTierEntity } from '../../domain/entities/membership-tier.entity';
import { GetMembershipTiersUseCase } from './get-membership-tiers.use-case';

describe('GetMembershipTiersUseCase', () => {
  const membershipTierRepository = {
    findByChannelId: jest.fn(),
  };

  let useCase: GetMembershipTiersUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetMembershipTiersUseCase(membershipTierRepository as never);
  });

  it('returns membership tiers without extra channel validation', async () => {
    const tier = MembershipTierEntity.create({
      channelId: 'channel-1',
      name: 'Tier 1',
      level: 1,
      priceCoin: 100,
    });
    membershipTierRepository.findByChannelId.mockResolvedValue([tier]);

    const result = await useCase.execute({ channelId: 'channel-1' });

    expect(membershipTierRepository.findByChannelId).toHaveBeenCalledWith(
      'channel-1',
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: tier.id,
      channelId: 'channel-1',
      name: 'Tier 1',
      level: 1,
      priceCoin: 100,
      isAcceptingNew: true,
    });
  });
});
