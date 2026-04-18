import { ForbiddenException } from '@shared/domain/exceptions/domain.exception';
import {
  ChannelEntity,
  ChannelStatus,
} from '../../domain/entities/channel.entity';
import { MembershipTierEntity } from '../../domain/entities/membership-tier.entity';
import { DisableMembershipTierUseCase } from './disable-membership-tier.use-case';

describe('DisableMembershipTierUseCase', () => {
  const membershipTierRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  };
  const channelRepository = {
    findById: jest.fn(),
  };

  let useCase: DisableMembershipTierUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new DisableMembershipTierUseCase(
      membershipTierRepository as never,
      channelRepository as never,
    );
  });

  it('disables membership tier for owned active channel', async () => {
    const channel = ChannelEntity.create({
      userId: 'user-1',
      name: 'Channel',
      bio: 'Bio',
    });
    const tier = MembershipTierEntity.create({
      channelId: channel.id,
      name: 'Tier 1',
      level: 1,
      priceCoin: 100,
    });

    channelRepository.findById.mockResolvedValue(channel);
    membershipTierRepository.findById.mockResolvedValue(tier);
    membershipTierRepository.update.mockResolvedValue(undefined);

    const result = await useCase.execute({
      channelId: channel.id,
      tierId: tier.id,
      userId: 'user-1',
    });

    expect(membershipTierRepository.update).toHaveBeenCalledWith(tier);
    expect(result.isAcceptingNew).toBe(false);
  });

  it('throws when channel is not active', async () => {
    const channel = ChannelEntity.create({
      userId: 'user-1',
      name: 'Channel',
      bio: 'Bio',
    });
    channel.update({ status: ChannelStatus.INACTIVE });

    channelRepository.findById.mockResolvedValue(channel);

    await expect(
      useCase.execute({
        channelId: channel.id,
        tierId: 'tier-1',
        userId: 'user-1',
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
