import {
  ChannelEntity,
  ChannelStatus,
} from '../../domain/entities/channel.entity';
import { ChannelMembershipEntity } from '../../domain/entities/channel-membership.entity';
import { MembershipTierEntity } from '../../domain/entities/membership-tier.entity';
import { HandleMembershipPaymentSuccessUseCase } from './handle-membership-payment-success.use-case';

class FakeChannelMembershipRepository {
  public readonly items = new Map<string, ChannelMembershipEntity>();

  create(membership: ChannelMembershipEntity): Promise<void> {
    this.items.set(
      this.key(membership.userId, membership.channelId),
      membership,
    );
    return Promise.resolve();
  }

  update(membership: ChannelMembershipEntity): Promise<void> {
    this.items.set(
      this.key(membership.userId, membership.channelId),
      membership,
    );
    return Promise.resolve();
  }

  findById(): Promise<ChannelMembershipEntity | null> {
    return Promise.resolve(null);
  }

  findByUserIdAndChannelId(
    userId: string,
    channelId: string,
  ): Promise<ChannelMembershipEntity | null> {
    return Promise.resolve(this.items.get(this.key(userId, channelId)) ?? null);
  }

  findByChannelId(): Promise<ChannelMembershipEntity[]> {
    return Promise.resolve([]);
  }

  findByUserId(): Promise<ChannelMembershipEntity[]> {
    return Promise.resolve([]);
  }

  countByChannelId(): Promise<number> {
    return Promise.resolve(0);
  }

  findByUserIdAndChannelIdActive(
    userId: string,
    channelId: string,
  ): Promise<ChannelMembershipEntity | null> {
    return Promise.resolve(this.items.get(this.key(userId, channelId)) ?? null);
  }

  upsert(membership: ChannelMembershipEntity): Promise<void> {
    this.items.set(
      this.key(membership.userId, membership.channelId),
      membership,
    );
    return Promise.resolve();
  }

  private key(userId: string, channelId: string): string {
    return `${userId}:${channelId}`;
  }
}

describe('HandleMembershipPaymentSuccessUseCase', () => {
  const cacheService = {
    setIfNotExists: jest.fn(),
  };
  const channelRepository = {
    findById: jest.fn(),
  };
  const membershipTierRepository = {
    findById: jest.fn(),
  };
  const compensationPublisher = {
    publishCompensationRequest: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    cacheService.setIfNotExists.mockResolvedValue(true);
    channelRepository.findById.mockResolvedValue(buildChannel());
    membershipTierRepository.findById.mockResolvedValue(buildTier());
  });

  it('creates active membership with default one-month expiry when event omits expiryDate', async () => {
    const dateNowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-05-04T00:00:00.000Z').getTime());
    const repository = new FakeChannelMembershipRepository();
    const useCase = new HandleMembershipPaymentSuccessUseCase(
      repository as never,
      channelRepository as never,
      membershipTierRepository as never,
      cacheService as never,
      compensationPublisher as never,
    );

    await useCase.execute({
      eventId: 'event-1',
      data: {
        userId: 'user-1',
        channelId: 'channel-1',
        membershipTierId: 'tier-1',
        paymentType: 'new',
        chargedCoinAmount: 50,
        ledgerReferenceId: 'ledger-1',
      },
    });

    const membership = await repository.findByUserIdAndChannelId(
      'user-1',
      'channel-1',
    );

    expect(membership?.membershipId).toBe('tier-1');
    expect(membership?.expiryDate?.toISOString()).toBe(
      '2026-06-04T00:00:00.000Z',
    );
    expect(
      compensationPublisher.publishCompensationRequest,
    ).not.toHaveBeenCalled();
    dateNowSpy.mockRestore();
  });

  it('extends existing active membership from its current expiry date', async () => {
    const dateNowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-05-04T00:00:00.000Z').getTime());
    const repository = new FakeChannelMembershipRepository();
    const existing = ChannelMembershipEntity.create({
      userId: 'user-2',
      channelId: 'channel-2',
      membershipId: 'tier-1',
      expiryDate: new Date('2026-06-15T00:00:00.000Z'),
    });
    await repository.upsert(existing);
    channelRepository.findById.mockResolvedValue(
      buildChannel({ id: 'channel-2' }),
    );
    membershipTierRepository.findById.mockResolvedValue(
      buildTier({ id: 'tier-2', channelId: 'channel-2' }),
    );
    const useCase = new HandleMembershipPaymentSuccessUseCase(
      repository as never,
      channelRepository as never,
      membershipTierRepository as never,
      cacheService as never,
      compensationPublisher as never,
    );

    await useCase.execute({
      eventId: 'event-2',
      data: {
        userId: 'user-2',
        channelId: 'channel-2',
        membershipTierId: 'tier-2',
        paymentType: 'upgrade',
        chargedCoinAmount: 150,
        ledgerReferenceId: 'ledger-2',
      },
    });

    const membership = await repository.findByUserIdAndChannelId(
      'user-2',
      'channel-2',
    );

    expect(membership?.membershipId).toBe('tier-2');
    expect(membership?.expiryDate?.toISOString()).toBe(
      '2026-07-15T00:00:00.000Z',
    );
    dateNowSpy.mockRestore();
  });

  it('publishes compensation instead of granting when admin closed membership', async () => {
    const repository = new FakeChannelMembershipRepository();
    channelRepository.findById.mockResolvedValue(
      buildChannel({ isMembershipClosedByAdmin: true }),
    );
    const useCase = new HandleMembershipPaymentSuccessUseCase(
      repository as never,
      channelRepository as never,
      membershipTierRepository as never,
      cacheService as never,
      compensationPublisher as never,
    );

    await useCase.execute({
      eventId: 'event-closed',
      data: {
        userId: 'user-3',
        channelId: 'channel-1',
        membershipTierId: 'tier-1',
        paymentType: 'renew',
        chargedCoinAmount: 60,
        ledgerReferenceId: 'ledger-3',
      },
    });

    expect(repository.items.size).toBe(0);
    expect(
      compensationPublisher.publishCompensationRequest,
    ).toHaveBeenCalledWith({
      sourcePaymentEventId: 'event-closed',
      userId: 'user-3',
      channelId: 'channel-1',
      membershipTierId: 'tier-1',
      paymentType: 'renew',
      chargedCoinAmount: 60,
      ledgerReferenceId: 'ledger-3',
      reasonCode: 'ADMIN_CLOSED',
    });
  });

  it('ignores duplicate event ids', async () => {
    cacheService.setIfNotExists.mockResolvedValue(false);
    const repository = new FakeChannelMembershipRepository();
    const useCase = new HandleMembershipPaymentSuccessUseCase(
      repository as never,
      channelRepository as never,
      membershipTierRepository as never,
      cacheService as never,
      compensationPublisher as never,
    );

    await useCase.execute({
      eventId: 'event-3',
      data: {
        userId: 'user-3',
        channelId: 'channel-3',
        membershipTierId: 'tier-3',
        paymentType: 'new',
        chargedCoinAmount: 70,
      },
    });

    expect(repository.items.size).toBe(0);
    expect(
      compensationPublisher.publishCompensationRequest,
    ).not.toHaveBeenCalled();
  });

  it('deduplicates sync and async handling by ledger reference id', async () => {
    cacheService.setIfNotExists.mockResolvedValue(false);
    const repository = new FakeChannelMembershipRepository();
    const useCase = new HandleMembershipPaymentSuccessUseCase(
      repository as never,
      channelRepository as never,
      membershipTierRepository as never,
      cacheService as never,
      compensationPublisher as never,
    );

    await useCase.execute({
      eventId: 'event-after-sync',
      data: {
        userId: 'user-4',
        channelId: 'channel-1',
        membershipTierId: 'tier-1',
        paymentType: 'new',
        chargedCoinAmount: 50,
        ledgerReferenceId: 'tx-1',
      },
    });

    expect(cacheService.setIfNotExists).toHaveBeenCalledWith(
      'media:membership-payment:tx-1',
      '1',
      60 * 60 * 24,
    );
    expect(repository.items.size).toBe(0);
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

function buildTier(
  overrides: Partial<
    ConstructorParameters<typeof MembershipTierEntity>[0]
  > = {},
): MembershipTierEntity {
  return new MembershipTierEntity({
    id: 'tier-1',
    channelId: 'channel-1',
    name: 'Silver',
    level: 1,
    priceCoin: 50,
    isAcceptingNew: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}
