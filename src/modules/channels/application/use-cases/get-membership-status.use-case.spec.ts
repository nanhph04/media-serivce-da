import {
  ChannelEntity,
  ChannelStatus,
} from '../../domain/entities/channel.entity';
import { ChannelMembershipEntity } from '../../domain/entities/channel-membership.entity';
import { GetMembershipStatusUseCase } from './get-membership-status.use-case';

describe('GetMembershipStatusUseCase', () => {
  const membershipRepository = {
    findByUserIdAndChannelIdActive: jest.fn(),
  };
  const channelRepository = {
    findById: jest.fn(),
  };

  const useCase = new GetMembershipStatusUseCase(
    membershipRepository as never,
    channelRepository as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('marks active member as unable to renew when membership is closed by admin', async () => {
    membershipRepository.findByUserIdAndChannelIdActive.mockResolvedValue(
      buildMembership(),
    );
    channelRepository.findById.mockResolvedValue(
      buildChannel({ isMembershipClosedByAdmin: true }),
    );

    await expect(
      useCase.execute({ channelId: 'channel-1', userId: 'user-1' }),
    ).resolves.toEqual({
      isActive: true,
      membershipId: 'tier-1',
      expiryDate: new Date('2099-01-01T00:00:00.000Z'),
      canRenew: false,
      canUpgrade: false,
      membershipBlockedReason: 'ADMIN_CLOSED',
      isMembershipClosedByAdmin: true,
    });
  });
});

function buildChannel(
  overrides: Partial<ConstructorParameters<typeof ChannelEntity>[0]> = {},
): ChannelEntity {
  return new ChannelEntity({
    id: 'channel-1',
    userId: 'owner-1',
    name: 'Channel',
    bio: 'Bio',
    avatarUrl: '',
    bannerUrl: '',
    status: ChannelStatus.ACTIVE,
    isEligibleForMembership: true,
    isMembershipClosedByAdmin: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}

function buildMembership(): ChannelMembershipEntity {
  return new ChannelMembershipEntity({
    id: 'membership-1',
    userId: 'user-1',
    channelId: 'channel-1',
    membershipId: 'tier-1',
    expiryDate: new Date('2099-01-01T00:00:00.000Z'),
    retryCount: 0,
    status: 'active',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}
