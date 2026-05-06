import { ForbiddenException } from '@shared/domain/exceptions/domain.exception';
import { ChannelEntity, ChannelStatus } from '../../domain/entities/channel.entity';
import { MembershipTierEntity } from '../../domain/entities/membership-tier.entity';
import { UpdateMembershipTierUseCase } from './update-membership-tier.use-case';

describe('UpdateMembershipTierUseCase', () => {
  const membershipTierRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  };
  const channelRepository = {
    findById: jest.fn(),
  };
  const membershipConfig = {
    getMinPriceForLevel: jest.fn(),
  };

  const useCase = new UpdateMembershipTierUseCase(
    membershipTierRepository as never,
    channelRepository as never,
    membershipConfig as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    channelRepository.findById.mockResolvedValue(buildChannel());
    membershipTierRepository.findById.mockResolvedValue(
      buildTier({ isAcceptingNew: false }),
    );
    membershipConfig.getMinPriceForLevel.mockReturnValue(10);
  });

  it('allows reopening tier once channel already earned eligibility', async () => {
    const result = await useCase.execute({
      channelId: 'channel-1',
      tierId: 'tier-1',
      userId: 'owner-1',
      isAcceptingNew: true,
    });

    expect(result.isAcceptingNew).toBe(true);
    expect(membershipTierRepository.update).toHaveBeenCalled();
  });

  it('blocks reopen when admin closed membership', async () => {
    channelRepository.findById.mockResolvedValue(
      buildChannel({ isMembershipClosedByAdmin: true }),
    );

    await expect(
      useCase.execute({
        channelId: 'channel-1',
        tierId: 'tier-1',
        userId: 'owner-1',
        isAcceptingNew: true,
      }),
    ).rejects.toThrow(ForbiddenException);
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
  overrides: Partial<ConstructorParameters<typeof MembershipTierEntity>[0]> = {},
): MembershipTierEntity {
  return new MembershipTierEntity({
    id: 'tier-1',
    channelId: 'channel-1',
    name: 'Gold',
    level: 1,
    priceCoin: 100,
    isAcceptingNew: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}
