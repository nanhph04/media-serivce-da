import { ChannelEntity, ChannelStatus } from '../../domain/entities/channel.entity';
import { MembershipTierEntity } from '../../domain/entities/membership-tier.entity';
import { GetChannelDetailUseCase } from './get-channel-detail.use-case';

describe('GetChannelDetailUseCase', () => {
  const channelRepository = {
    findById: jest.fn(),
  };
  const membershipTierRepository = {
    findByChannelId: jest.fn(),
  };
  const eligibilityService = {
    getChannelEligibility: jest.fn(),
  };
  const videoQueryService = {
    getPublicVideoSummariesByChannel: jest.fn(),
  };

  const useCase = new GetChannelDetailUseCase(
    channelRepository as never,
    membershipTierRepository as never,
    eligibilityService as never,
    videoQueryService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    channelRepository.findById.mockResolvedValue(buildChannel());
    membershipTierRepository.findByChannelId.mockResolvedValue([
      buildTier(),
      buildTier({
        id: 'tier-2',
        level: 2,
        isAcceptingNew: false,
      }),
    ]);
    eligibilityService.getChannelEligibility.mockResolvedValue({
      isEligible: false,
      readyVideoCount: 4,
      minReadyVideoCount: 5,
      totalVideoViews: 600,
      minTotalVideoViews: 1000,
      missingRequirements: [
        'Channel must have at least 5 ready videos',
        'Channel must have at least 1000 total views',
      ],
    });
    videoQueryService.getPublicVideoSummariesByChannel.mockResolvedValue([]);
  });

  it('returns channel detail with membership eligibility breakdown', async () => {
    const result = await useCase.execute({ channelId: 'channel-1' });

    expect(result.channel.isEligibleForMembership).toBe(false);
    expect(result.membershipEligibility).toEqual({
      isEligible: false,
      readyVideoCount: 4,
      minReadyVideoCount: 5,
      totalVideoViews: 600,
      minTotalVideoViews: 1000,
      missingRequirements: [
        'Channel must have at least 5 ready videos',
        'Channel must have at least 1000 total views',
      ],
    });
    expect(result.membershipTiers).toHaveLength(1);
  });
});

function buildChannel(): ChannelEntity {
  return new ChannelEntity({
    id: 'channel-1',
    userId: 'owner-1',
    name: 'Channel',
    bio: 'Bio',
    avatarUrl: '',
    bannerUrl: '',
    status: ChannelStatus.ACTIVE,
    isEligibleForMembership: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

function buildTier(
  overrides: Partial<ConstructorParameters<typeof MembershipTierEntity>[0]> = {},
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
