import { MembershipPurchaseController } from './membership-purchase.controller';

describe('MembershipPurchaseController', () => {
  const purchaseMembershipUseCase = {
    execute: jest.fn(),
  };
  const controller = new MembershipPurchaseController(
    purchaseMembershipUseCase as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('purchases a membership using current user and route params', async () => {
    purchaseMembershipUseCase.execute.mockResolvedValue({
      membership: {
        id: 'membership-1',
        userId: 'viewer-1',
        channelId: 'channel-1',
        membershipId: 'tier-1',
        expiryDate: new Date('2026-06-01T00:00:00.000Z'),
        retryCount: 0,
        status: 'active',
        autoRenewEnabled: true,
        renewalStatus: 'idle',
        renewalReminderSentAt: null,
        lastRenewalAttemptAt: null,
        nextRenewalAttemptAt: null,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-01T00:00:00.000Z'),
      },
      chargedCoinAmount: 100,
      paymentTransactionId: 'tx-1',
    });

    const result = await controller.purchaseMembership(
      'viewer-1',
      'trace-1',
      'channel-1',
      'tier-1',
    );

    expect(purchaseMembershipUseCase.execute).toHaveBeenCalledWith({
      userId: 'viewer-1',
      traceId: 'trace-1',
      channelId: 'channel-1',
      tierId: 'tier-1',
    });
    expect(result).toEqual({
      membership: {
        id: 'membership-1',
        userId: 'viewer-1',
        channelId: 'channel-1',
        membershipId: 'tier-1',
        expiryDate: '2026-06-01T00:00:00.000Z',
        retryCount: 0,
        status: 'active',
        autoRenewEnabled: true,
        renewalStatus: 'idle',
        renewalReminderSentAt: null,
        lastRenewalAttemptAt: null,
        nextRenewalAttemptAt: null,
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z',
      },
      chargedCoinAmount: 100,
      paymentTransactionId: 'tx-1',
    });
  });
});
