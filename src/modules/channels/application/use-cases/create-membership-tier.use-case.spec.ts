import {
  ForbiddenException,
  type BadRequestException,
} from '@shared/domain/exceptions/domain.exception';
import { ChannelEntity, ChannelStatus } from '../../domain/entities/channel.entity';
import { MembershipTierEntity } from '../../domain/entities/membership-tier.entity';
import { CreateMembershipTierUseCase } from './create-membership-tier.use-case';

describe('CreateMembershipTierUseCase', () => {
  const membershipTierRepository = {
    findByChannelId: jest.fn(),
    create: jest.fn(),
  };
  const channelRepository = {
    findById: jest.fn(),
  };
  const membershipConfig = {
    getMinPriceForLevel: jest.fn(),
  };
  const eligibilityService = {
    syncChannelEligibility: jest.fn(),
  };

  const useCase = new CreateMembershipTierUseCase(
    membershipTierRepository as never,
    channelRepository as never,
    membershipConfig as never,
    eligibilityService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    channelRepository.findById.mockResolvedValue(buildChannel());
    membershipTierRepository.findByChannelId.mockResolvedValue([]);
    membershipTierRepository.create.mockResolvedValue(undefined);
    membershipConfig.getMinPriceForLevel.mockReturnValue(10);
  });

  it('rejects create when channel is not eligible for membership registration', async () => {
    eligibilityService.syncChannelEligibility.mockResolvedValue({
      isEligible: false,
      readyVideoCount: 2,
      minReadyVideoCount: 5,
      totalVideoViews: 300,
      minTotalVideoViews: 1000,
      missingRequirements: [
        'Channel must have at least 5 ready videos',
        'Channel must have at least 1000 total views',
      ],
    });

    await expect(
      useCase.execute({
        channelId: 'channel-1',
        userId: 'owner-1',
        name: 'Silver',
        level: 1,
        priceCoin: 100,
      }),
    ).rejects.toMatchObject<Partial<ForbiddenException>>({
      message: 'Channel is not eligible to open membership registration yet',
      errors: [
        'Channel must have at least 5 ready videos',
        'Channel must have at least 1000 total views',
      ],
    });
    expect(membershipTierRepository.create).not.toHaveBeenCalled();
  });

  it('creates tier when channel eligibility is satisfied', async () => {
    eligibilityService.syncChannelEligibility.mockResolvedValue({
      isEligible: true,
      readyVideoCount: 5,
      minReadyVideoCount: 5,
      totalVideoViews: 1000,
      minTotalVideoViews: 1000,
      missingRequirements: [],
    });

    const result = await useCase.execute({
      channelId: 'channel-1',
      userId: 'owner-1',
      name: 'Gold',
      level: 2,
      priceCoin: 100,
    });

    expect(result.name).toBe('Gold');
    expect(result.level).toBe(2);
    expect(membershipTierRepository.create).toHaveBeenCalledWith(
      expect.any(MembershipTierEntity),
    );
  });

  it('keeps min price validation after eligibility passes', async () => {
    eligibilityService.syncChannelEligibility.mockResolvedValue({
      isEligible: true,
      readyVideoCount: 5,
      minReadyVideoCount: 5,
      totalVideoViews: 1000,
      minTotalVideoViews: 1000,
      missingRequirements: [],
    });

    await expect(
      useCase.execute({
        channelId: 'channel-1',
        userId: 'owner-1',
        name: 'Gold',
        level: 2,
        priceCoin: 5,
      }),
    ).rejects.toMatchObject<Partial<BadRequestException>>({
      message: 'Price must be at least 10 coin for level 2',
    });
  });

  it('allows creating a tier without rechecking thresholds once channel earned eligibility', async () => {
    channelRepository.findById.mockResolvedValue(
      buildChannel({ isEligibleForMembership: true }),
    );

    await useCase.execute({
      channelId: 'channel-1',
      userId: 'owner-1',
      name: 'Platinum',
      level: 3,
      priceCoin: 100,
    });

    expect(eligibilityService.syncChannelEligibility).not.toHaveBeenCalled();
    expect(membershipTierRepository.create).toHaveBeenCalled();
  });

  it('blocks create when membership is closed by admin', async () => {
    channelRepository.findById.mockResolvedValue(
      buildChannel({ isMembershipClosedByAdmin: true }),
    );

    await expect(
      useCase.execute({
        channelId: 'channel-1',
        userId: 'owner-1',
        name: 'Gold',
        level: 1,
        priceCoin: 100,
      }),
    ).rejects.toThrow('Membership registration is temporarily closed by admin');
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
    isEligibleForMembership: false,
    isMembershipClosedByAdmin: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}
