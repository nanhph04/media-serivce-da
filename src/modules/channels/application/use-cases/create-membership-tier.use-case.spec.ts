import {
  ConflictException,
  ForbiddenException,
} from '@shared/domain/exceptions/domain.exception';
import {
  ChannelEntity,
  ChannelStatus,
} from '../../domain/entities/channel.entity';
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

  let useCase: CreateMembershipTierUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateMembershipTierUseCase(
      membershipTierRepository as never,
      channelRepository as never,
      membershipConfig,
    );
  });

  it('throws conflict when membership tier level already exists', async () => {
    const channel = ChannelEntity.create({
      userId: 'user-1',
      name: 'Channel',
      bio: 'Bio',
    });
    const existingTier = MembershipTierEntity.create({
      channelId: channel.id,
      name: 'Tier 1',
      level: 1,
      priceCoin: 100,
    });

    channelRepository.findById.mockResolvedValue(channel);
    membershipTierRepository.findByChannelId.mockResolvedValue([existingTier]);

    await expect(
      useCase.execute({
        channelId: channel.id,
        userId: 'user-1',
        name: 'Another Tier',
        level: 1,
        priceCoin: 200,
      }),
    ).rejects.toThrow(ConflictException);
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
        userId: 'user-1',
        name: 'Tier 1',
        level: 1,
        priceCoin: 200,
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
