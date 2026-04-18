import {
  ChannelMembershipEntity,
  ChannelMembershipStatus,
} from '../../domain/entities/channel-membership.entity';
import { GetMembershipStatusUseCase } from './get-membership-status.use-case';

describe('GetMembershipStatusUseCase', () => {
  const membershipRepository = {
    findByUserIdAndChannelIdActive: jest.fn(),
  };

  let useCase: GetMembershipStatusUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetMembershipStatusUseCase(membershipRepository as never);
  });

  it('returns active membership status when membership is active', async () => {
    const activeMembership = ChannelMembershipEntity.create({
      userId: 'user-1',
      channelId: 'channel-1',
      membershipId: 'tier-1',
      expiryDate: new Date(Date.now() + 60_000),
    });
    membershipRepository.findByUserIdAndChannelIdActive.mockResolvedValue(
      activeMembership,
    );

    const result = await useCase.execute({
      userId: 'user-1',
      channelId: 'channel-1',
    });

    expect(result).toEqual({
      isActive: true,
      membershipId: 'tier-1',
      expiryDate: activeMembership.expiryDate,
    });
  });

  it('returns inactive membership status for cancelled membership', async () => {
    const cancelledMembership = new ChannelMembershipEntity({
      id: 'membership-1',
      userId: 'user-1',
      channelId: 'channel-1',
      membershipId: 'tier-1',
      expiryDate: new Date(Date.now() + 60_000),
      retryCount: 0,
      status: ChannelMembershipStatus.CANCELLED,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    membershipRepository.findByUserIdAndChannelIdActive.mockResolvedValue(
      cancelledMembership,
    );

    const result = await useCase.execute({
      userId: 'user-1',
      channelId: 'channel-1',
    });

    expect(result).toEqual({
      isActive: false,
      membershipId: 'tier-1',
      expiryDate: cancelledMembership.expiryDate,
    });
  });
});
