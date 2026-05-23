import { BadRequestException } from '@shared/domain/exceptions/domain.exception';

import { ChannelMembershipEntity } from '../../domain/entities/channel-membership.entity';
import {
  ChannelEntity,
  ChannelStatus,
  MembershipReviewStatus,
} from '../../domain/entities/channel.entity';
import { MembershipTierEntity } from '../../domain/entities/membership-tier.entity';
import { PurchaseMembershipUseCase } from './purchase-membership.use-case';

describe('PurchaseMembershipUseCase', () => {
  const channelRepository = {
    findById: jest.fn(),
  };
  const membershipRepository = {
    findByUserIdAndChannelId: jest.fn(),
  };
  const membershipTierRepository = {
    findById: jest.fn(),
  };
  const financePaymentClient = {
    charge: jest.fn(),
  };
  const handleMembershipPaymentSuccessUseCase = {
    execute: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    channelRepository.findById.mockResolvedValue(buildChannel());
    membershipTierRepository.findById.mockResolvedValue(buildTier());
    membershipRepository.findByUserIdAndChannelId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(buildMembership());
    financePaymentClient.charge.mockResolvedValue({
      transactions: [{ id: 'tx-1' }],
    });
  });

  it('charges authoritative tier price and creates membership through payment success flow', async () => {
    const useCase = new PurchaseMembershipUseCase(
      channelRepository as never,
      membershipRepository as never,
      membershipTierRepository as never,
      financePaymentClient as never,
      handleMembershipPaymentSuccessUseCase as never,
    );

    const result = await useCase.execute({
      userId: 'viewer-1',
      channelId: 'channel-1',
      tierId: 'tier-1',
      traceId: 'trace-1',
    });

    expect(financePaymentClient.charge).toHaveBeenCalledWith({
      payerUserId: 'viewer-1',
      idempotencyKey: 'membership-purchase:viewer-1:tier-1:new',
      traceId: 'trace-1',
      serviceType: 'membership',
      serviceId: 'tier-1',
      channelId: 'channel-1',
      channelOwnerId: 'creator-1',
      coinAmount: 100,
      metadata: {
        packageName: 'Gold',
      },
    });
    expect(handleMembershipPaymentSuccessUseCase.execute).toHaveBeenCalledWith({
      eventId: 'sync:tx-1',
      data: {
        userId: 'viewer-1',
        channelId: 'channel-1',
        membershipTierId: 'tier-1',
        paymentType: 'new',
        chargedCoinAmount: 100,
        ledgerReferenceId: 'tx-1',
      },
    });
    expect(result.paymentTransactionId).toBe('tx-1');
    expect(result.chargedCoinAmount).toBe(100);
    expect(result.membership.channelId).toBe('channel-1');
  });

  it('rejects an active existing membership before charging finance', async () => {
    membershipRepository.findByUserIdAndChannelId.mockReset();
    membershipRepository.findByUserIdAndChannelId.mockResolvedValue(
      buildMembership(),
    );
    const useCase = new PurchaseMembershipUseCase(
      channelRepository as never,
      membershipRepository as never,
      membershipTierRepository as never,
      financePaymentClient as never,
      handleMembershipPaymentSuccessUseCase as never,
    );

    await expect(
      useCase.execute({
        userId: 'viewer-1',
        channelId: 'channel-1',
        tierId: 'tier-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(financePaymentClient.charge).not.toHaveBeenCalled();
  });

  it('creates free membership without calling finance', async () => {
    membershipTierRepository.findById.mockResolvedValue(
      buildTier({ priceCoin: 0 }),
    );
    const useCase = new PurchaseMembershipUseCase(
      channelRepository as never,
      membershipRepository as never,
      membershipTierRepository as never,
      financePaymentClient as never,
      handleMembershipPaymentSuccessUseCase as never,
    );

    const result = await useCase.execute({
      userId: 'viewer-1',
      channelId: 'channel-1',
      tierId: 'tier-1',
    });

    expect(financePaymentClient.charge).not.toHaveBeenCalled();
    expect(handleMembershipPaymentSuccessUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 'membership-free:viewer-1:tier-1:new',
      }),
    );
    expect(result.paymentTransactionId).toBeNull();
    expect(result.chargedCoinAmount).toBe(0);
  });
});

function buildChannel(
  overrides: Partial<ConstructorParameters<typeof ChannelEntity>[0]> = {},
): ChannelEntity {
  return new ChannelEntity({
    id: 'channel-1',
    userId: 'creator-1',
    name: 'Channel',
    bio: 'Bio',
    avatarUrl: '',
    bannerUrl: '',
    status: ChannelStatus.ACTIVE,
    isEligibleForMembership: true,
    isMembershipClosedByAdmin: false,
    membershipReviewStatus: MembershipReviewStatus.APPROVED,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}

function buildTier(
  overrides: Partial<
    ConstructorParameters<typeof MembershipTierEntity>[0]
  > = {},
): MembershipTierEntity {
  return new MembershipTierEntity({
    id: 'tier-1',
    channelId: 'channel-1',
    name: 'Gold',
    level: 1,
    priceCoin: 100,
    isAcceptingNew: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}

function buildMembership(): ChannelMembershipEntity {
  return ChannelMembershipEntity.create({
    userId: 'viewer-1',
    channelId: 'channel-1',
    membershipId: 'tier-1',
    expiryDate: new Date('2099-01-01T00:00:00.000Z'),
  });
}
