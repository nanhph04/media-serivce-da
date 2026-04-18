import { ChannelMembershipEntity } from '../../domain/entities/channel-membership.entity';
import { HandleMembershipPaymentSuccessUseCase } from './handle-membership-payment-success.use-case';

describe('HandleMembershipPaymentSuccessUseCase', () => {
  const membershipRepository = {
    findByUserIdAndChannelId: jest.fn(),
    upsert: jest.fn(),
  };
  const cacheService = {
    setIfNotExists: jest.fn(),
  };

  let useCase: HandleMembershipPaymentSuccessUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new HandleMembershipPaymentSuccessUseCase(
      membershipRepository as never,
      cacheService as never,
    );
  });

  it('creates a new membership from finance event when none exists', async () => {
    cacheService.setIfNotExists.mockResolvedValue(true);
    membershipRepository.findByUserIdAndChannelId.mockResolvedValue(null);

    await useCase.execute({
      eventId: 'event-1',
      data: {
        userId: 'user-1',
        channelId: 'channel-1',
        membershipTierId: 'tier-1',
        expiryDate: '2026-05-01T00:00:00.000Z',
      },
    });

    expect(membershipRepository.upsert).toHaveBeenCalledTimes(1);
    const createdMembership = membershipRepository.upsert.mock.calls[0][0] as
      | ChannelMembershipEntity
      | undefined;
    expect(createdMembership).toBeInstanceOf(ChannelMembershipEntity);
    expect(createdMembership?.userId).toBe('user-1');
    expect(createdMembership?.channelId).toBe('channel-1');
    expect(createdMembership?.membershipId).toBe('tier-1');
  });

  it('updates an existing membership from finance event when record exists', async () => {
    const existingMembership = ChannelMembershipEntity.create({
      userId: 'user-1',
      channelId: 'channel-1',
      membershipId: 'tier-old',
      expiryDate: new Date('2026-04-01T00:00:00.000Z'),
    });

    cacheService.setIfNotExists.mockResolvedValue(true);
    membershipRepository.findByUserIdAndChannelId.mockResolvedValue(
      existingMembership,
    );

    await useCase.execute({
      eventId: 'event-1',
      data: {
        userId: 'user-1',
        channelId: 'channel-1',
        membershipTierId: 'tier-new',
        expiryDate: '2026-05-01T00:00:00.000Z',
      },
    });

    expect(membershipRepository.upsert).toHaveBeenCalledWith(existingMembership);
    expect(existingMembership.membershipId).toBe('tier-new');
    expect(existingMembership.expiryDate?.toISOString()).toBe(
      '2026-05-01T00:00:00.000Z',
    );
  });
});
