import { ChannelMembershipStatus } from '../../domain/entities/channel-membership.entity';
import { GetMyMembershipsUseCase } from './get-my-memberships.use-case';

describe('GetMyMembershipsUseCase', () => {
  const userMembershipQueryService = {
    getMembershipsByUserId: jest.fn(),
  };

  const useCase = new GetMyMembershipsUseCase(
    userMembershipQueryService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps paginated memberships and computes state flags', async () => {
    userMembershipQueryService.getMembershipsByUserId.mockResolvedValue({
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
      total: 25,
    });

    await expect(
      useCase.execute({ userId: 'user-1', page: 2, limit: 10 }),
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
          isActive: true,
          canRenew: false,
          canUpgrade: false,
          isMembershipClosedByAdmin: true,
          membershipBlockedReason: 'ADMIN_CLOSED',
        },
      ],
      pagination: {
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      },
    });
  });

  it('returns zero totalPages when there are no memberships', async () => {
    userMembershipQueryService.getMembershipsByUserId.mockResolvedValue({
      items: [],
      total: 0,
    });

    await expect(
      useCase.execute({ userId: 'user-1', page: 1, limit: 20 }),
    ).resolves.toEqual({
      items: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    });
  });
});
