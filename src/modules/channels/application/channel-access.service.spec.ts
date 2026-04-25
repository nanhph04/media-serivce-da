import {
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import { ChannelAccessService } from './channel-access.service';
import { ChannelEntity, ChannelStatus } from '../domain/entities/channel.entity';
import { ChannelMembershipEntity } from '../domain/entities/channel-membership.entity';
import { MembershipTierEntity } from '../domain/entities/membership-tier.entity';

describe('ChannelAccessService', () => {
  const channelRepository = {
    findById: jest.fn(),
    findByUserId: jest.fn(),
  };
  const membershipRepository = {
    findByUserIdAndChannelIdActive: jest.fn(),
    findByUserId: jest.fn(),
  };
  const membershipTierRepository = {
    findById: jest.fn(),
  };

  const service = new ChannelAccessService(
    channelRepository as never,
    membershipRepository as never,
    membershipTierRepository as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws not found when channel does not exist', async () => {
    channelRepository.findById.mockResolvedValue(null);

    await expect(
      service.getViewerAccessContext('channel-1', 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns viewer context with channel status and null tier when no membership exists', async () => {
    channelRepository.findById.mockResolvedValue(
      buildChannel({ status: ChannelStatus.SUSPENDED }),
    );
    membershipRepository.findByUserIdAndChannelIdActive.mockResolvedValue(null);

    await expect(
      service.getViewerAccessContext('channel-1', 'user-1'),
    ).resolves.toEqual({
      channelOwnerId: 'owner-1',
      channelStatus: ChannelStatus.SUSPENDED,
      activeMembershipTierLevel: null,
    });
  });

  it('returns active membership tier level when membership and tier exist', async () => {
    channelRepository.findById.mockResolvedValue(buildChannel());
    membershipRepository.findByUserIdAndChannelIdActive.mockResolvedValue(
      buildMembership(),
    );
    membershipTierRepository.findById.mockResolvedValue(buildTier({ level: 2 }));

    await expect(
      service.getViewerAccessContext('channel-1', 'user-1'),
    ).resolves.toEqual({
      channelOwnerId: 'owner-1',
      channelStatus: ChannelStatus.ACTIVE,
      activeMembershipTierLevel: 2,
    });
  });

  it('asserts owner must own an active channel', async () => {
    channelRepository.findById.mockResolvedValue(
      buildChannel({ userId: 'owner-1', status: ChannelStatus.INACTIVE }),
    );

    await expect(
      service.assertOwnedActiveChannel('channel-1', 'owner-1'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('returns owned active channel id for the current user', async () => {
    channelRepository.findByUserId.mockResolvedValue(buildChannel());

    await expect(service.getOwnedActiveChannelId('owner-1')).resolves.toBe(
      'channel-1',
    );
  });

  it('throws not found when user does not have a channel', async () => {
    channelRepository.findByUserId.mockResolvedValue(null);

    await expect(service.getOwnedActiveChannelId('owner-1')).rejects.toThrow(
      NotFoundException,
    );
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
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}

function buildMembership(): ChannelMembershipEntity {
  return new ChannelMembershipEntity({
    id: 'membership-1',
    userId: 'user-1',
    channelId: 'channel-1',
    membershipId: 'tier-1',
    expiryDate: new Date('2099-01-01T00:00:00.000Z'),
    retryCount: 0,
    status: 'active',
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
