import { MembershipController } from './membership.controller';

describe('MembershipController', () => {
  const getMyMembershipsUseCase = {
    execute: jest.fn(),
  };

  const controller = new MembershipController(getMyMembershipsUseCase as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns paginated memberships for the current user', async () => {
    getMyMembershipsUseCase.execute.mockResolvedValue({
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
          canRenew: true,
          canUpgrade: true,
          isMembershipClosedByAdmin: false,
          membershipBlockedReason: null,
        },
      ],
      pagination: {
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      },
    });

    const result = await controller.getMyMemberships('user-1', '2', '10');

    expect(getMyMembershipsUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      page: 2,
      limit: 10,
    });
    expect(result).toEqual({
      success: true,
      statusCode: 200,
      data: [
        {
          membershipId: 'membership-1',
          channelId: 'channel-1',
          channelName: 'Channel',
          channelAvatarUrl: null,
          tierId: 'tier-1',
          tierName: 'Gold',
          tierLevel: 2,
          priceCoin: 300,
          startedAt: '2026-01-01T00:00:00.000Z',
          expiryDate: '2099-01-01T00:00:00.000Z',
          isActive: true,
          canRenew: true,
          canUpgrade: true,
          isMembershipClosedByAdmin: false,
          membershipBlockedReason: null,
        },
      ],
      message: undefined,
      pagination: {
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      },
    });
  });

  it('uses default page and clamps limit', async () => {
    getMyMembershipsUseCase.execute.mockResolvedValue({
      items: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
      },
    });

    await controller.getMyMemberships('user-1', undefined, '999');

    expect(getMyMembershipsUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      page: 1,
      limit: 50,
    });
  });
});
