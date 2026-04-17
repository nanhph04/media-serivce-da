import { ChannelApplicationService } from './channel.application.service';
import {
  ChannelMembershipEntity,
  ChannelMembershipStatus,
} from '../domain/entities/channel-membership.entity';

describe('ChannelApplicationService', () => {
  const channelRepository = {
    findByUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
  };
  const membershipTierRepository = {
    findByChannelId: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
  };
  const membershipRepository = {
    create: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
    findByUserIdAndChannelId: jest.fn(),
    findByChannelId: jest.fn(),
    findByUserId: jest.fn(),
    countByChannelId: jest.fn(),
    findByUserIdAndChannelIdActive: jest.fn(),
    upsert: jest.fn(),
  };
  const membershipConfig = {
    getMinPriceForLevel: jest.fn(),
  };
  const configService = {
    get: jest.fn(),
  };
  const cacheService = {
    setIfNotExists: jest.fn(),
  };
  const kafkaService = {
    on: jest.fn(),
  };
  const videoQueryService = {
    getPublicVideoSummariesByChannel: jest.fn(),
  };

  let service: ChannelApplicationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ChannelApplicationService(
      channelRepository,
      membershipTierRepository,
      membershipRepository,
      membershipConfig,
      configService as never,
      cacheService as never,
      kafkaService as never,
      videoQueryService,
    );
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

    const result = await service.getMembershipStatus({
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

    const result = await service.getMembershipStatus({
      userId: 'user-1',
      channelId: 'channel-1',
    });

    expect(result).toEqual({
      isActive: false,
      membershipId: 'tier-1',
      expiryDate: cancelledMembership.expiryDate,
    });
  });

  it('returns inactive membership status for expired membership', async () => {
    const expiredMembership = ChannelMembershipEntity.create({
      userId: 'user-1',
      channelId: 'channel-1',
      membershipId: 'tier-1',
      expiryDate: new Date(Date.now() - 60_000),
    });
    membershipRepository.findByUserIdAndChannelIdActive.mockResolvedValue(
      expiredMembership,
    );

    const result = await service.getMembershipStatus({
      userId: 'user-1',
      channelId: 'channel-1',
    });

    expect(result).toEqual({
      isActive: false,
      membershipId: 'tier-1',
      expiryDate: expiredMembership.expiryDate,
    });
  });

  it('creates a new membership from finance event when none exists', async () => {
    let handler:
      | ((payload: {
          value: {
            eventId: string;
            data: {
              userId: string;
              channelId: string;
              membershipTierId: string;
              expiryDate: string;
            };
          };
        }) => Promise<void>)
      | undefined;

    configService.get.mockReturnValue('membership.payment.success');
    cacheService.setIfNotExists.mockResolvedValue(true);
    membershipRepository.findByUserIdAndChannelId.mockResolvedValue(null);
    kafkaService.on.mockImplementation(
      async (
        _topic: string,
        callback: typeof handler,
      ): Promise<void> => {
        handler = callback;
      },
    );

    await service.handleFinanceEvents();

    await handler?.({
      value: {
        eventId: 'event-1',
        data: {
          userId: 'user-1',
          channelId: 'channel-1',
          membershipTierId: 'tier-1',
          expiryDate: '2026-05-01T00:00:00.000Z',
        },
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
    let handler:
      | ((payload: {
          value: {
            eventId: string;
            data: {
              userId: string;
              channelId: string;
              membershipTierId: string;
              expiryDate: string;
            };
          };
        }) => Promise<void>)
      | undefined;

    const existingMembership = ChannelMembershipEntity.create({
      userId: 'user-1',
      channelId: 'channel-1',
      membershipId: 'tier-old',
      expiryDate: new Date('2026-04-01T00:00:00.000Z'),
    });

    configService.get.mockReturnValue('membership.payment.success');
    cacheService.setIfNotExists.mockResolvedValue(true);
    membershipRepository.findByUserIdAndChannelId.mockResolvedValue(
      existingMembership,
    );
    kafkaService.on.mockImplementation(
      async (
        _topic: string,
        callback: typeof handler,
      ): Promise<void> => {
        handler = callback;
      },
    );

    await service.handleFinanceEvents();

    await handler?.({
      value: {
        eventId: 'event-1',
        data: {
          userId: 'user-1',
          channelId: 'channel-1',
          membershipTierId: 'tier-new',
          expiryDate: '2026-05-01T00:00:00.000Z',
        },
      },
    });

    expect(membershipRepository.upsert).toHaveBeenCalledWith(existingMembership);
    expect(existingMembership.membershipId).toBe('tier-new');
    expect(existingMembership.expiryDate?.toISOString()).toBe(
      '2026-05-01T00:00:00.000Z',
    );
  });
});
