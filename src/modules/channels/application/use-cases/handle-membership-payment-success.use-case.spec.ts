import { ChannelMembershipEntity } from '../../domain/entities/channel-membership.entity';
import type { IChannelMembershipRepository } from '../../domain/repositories/channel-membership.repository';
import { HandleMembershipPaymentSuccessUseCase } from './handle-membership-payment-success.use-case';

class FakeChannelMembershipRepository implements IChannelMembershipRepository {
  public readonly items = new Map<string, ChannelMembershipEntity>();

  public async create(membership: ChannelMembershipEntity): Promise<void> {
    this.items.set(this.key(membership.userId, membership.channelId), membership);
  }

  public async update(membership: ChannelMembershipEntity): Promise<void> {
    this.items.set(this.key(membership.userId, membership.channelId), membership);
  }

  public async findById(): Promise<ChannelMembershipEntity | null> {
    return null;
  }

  public async findByUserIdAndChannelId(
    userId: string,
    channelId: string,
  ): Promise<ChannelMembershipEntity | null> {
    return this.items.get(this.key(userId, channelId)) ?? null;
  }

  public async findByChannelId(): Promise<ChannelMembershipEntity[]> {
    return [];
  }

  public async findByUserId(): Promise<ChannelMembershipEntity[]> {
    return [];
  }

  public async countByChannelId(): Promise<number> {
    return 0;
  }

  public async findByUserIdAndChannelIdActive(
    userId: string,
    channelId: string,
  ): Promise<ChannelMembershipEntity | null> {
    return this.items.get(this.key(userId, channelId)) ?? null;
  }

  public async upsert(membership: ChannelMembershipEntity): Promise<void> {
    this.items.set(this.key(membership.userId, membership.channelId), membership);
  }

  private key(userId: string, channelId: string): string {
    return `${userId}:${channelId}`;
  }
}

describe('HandleMembershipPaymentSuccessUseCase', () => {
  const cacheService = {
    setIfNotExists: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates active membership with default one-month expiry when event omits expiryDate', async () => {
    const dateNowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-05-04T00:00:00.000Z').getTime());
    cacheService.setIfNotExists.mockResolvedValue(true);
    const repository = new FakeChannelMembershipRepository();
    const useCase = new HandleMembershipPaymentSuccessUseCase(
      repository,
      cacheService as never,
    );

    await useCase.execute({
      eventId: 'event-1',
      data: {
        userId: 'user-1',
        channelId: 'channel-1',
        membershipTierId: 'tier-1',
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
    dateNowSpy.mockRestore();
  });

  it('extends existing active membership from its current expiry date', async () => {
    const dateNowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-05-04T00:00:00.000Z').getTime());
    cacheService.setIfNotExists.mockResolvedValue(true);
    const repository = new FakeChannelMembershipRepository();
    const existing = ChannelMembershipEntity.create({
      userId: 'user-2',
      channelId: 'channel-2',
      membershipId: 'tier-1',
      expiryDate: new Date('2026-06-15T00:00:00.000Z'),
    });
    await repository.upsert(existing);
    const useCase = new HandleMembershipPaymentSuccessUseCase(
      repository,
      cacheService as never,
    );

    await useCase.execute({
      eventId: 'event-2',
      data: {
        userId: 'user-2',
        channelId: 'channel-2',
        membershipTierId: 'tier-2',
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

  it('ignores duplicate event ids', async () => {
    cacheService.setIfNotExists.mockResolvedValue(false);
    const repository = new FakeChannelMembershipRepository();
    const useCase = new HandleMembershipPaymentSuccessUseCase(
      repository,
      cacheService as never,
    );

    await useCase.execute({
      eventId: 'event-3',
      data: {
        userId: 'user-3',
        channelId: 'channel-3',
        membershipTierId: 'tier-3',
      },
    });

    expect(repository.items.size).toBe(0);
  });
});
