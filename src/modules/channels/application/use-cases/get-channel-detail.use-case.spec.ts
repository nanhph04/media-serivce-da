import { ChannelEntity } from '../../domain/entities/channel.entity';
import { MembershipTierEntity } from '../../domain/entities/membership-tier.entity';
import { GetChannelDetailUseCase } from './get-channel-detail.use-case';

describe('GetChannelDetailUseCase', () => {
  const channelRepository = {
    findById: jest.fn(),
  };
  const membershipTierRepository = {
    findByChannelId: jest.fn(),
  };
  const videoQueryService = {
    getPublicVideoSummariesByChannel: jest.fn(),
  };

  let useCase: GetChannelDetailUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetChannelDetailUseCase(
      channelRepository as never,
      membershipTierRepository as never,
      videoQueryService,
    );
  });

  it('returns channel detail with only accepting membership tiers', async () => {
    const channel = ChannelEntity.create({
      userId: 'user-1',
      name: 'Channel Name',
      bio: 'Channel Bio',
    });
    const visibleTier = MembershipTierEntity.create({
      channelId: channel.id,
      name: 'Tier 1',
      level: 1,
      priceCoin: 100,
    });
    const hiddenTier = MembershipTierEntity.create({
      channelId: channel.id,
      name: 'Tier 2',
      level: 2,
      priceCoin: 200,
    });
    hiddenTier.hide();

    channelRepository.findById.mockResolvedValue(channel);
    membershipTierRepository.findByChannelId.mockResolvedValue([
      visibleTier,
      hiddenTier,
    ]);
    videoQueryService.getPublicVideoSummariesByChannel.mockResolvedValue([
      {
        id: 'video-1',
        title: 'Public video',
        categories: ['general'],
        status: 'public',
        thumbnailUrl: null,
        publishedAt: null,
      },
    ]);

    const result = await useCase.execute({ channelId: channel.id });

    expect(result.channel.id).toBe(channel.id);
    expect(result.membershipTiers).toHaveLength(1);
    expect(result.membershipTiers[0]?.id).toBe(visibleTier.id);
    expect(result.publicVideos).toHaveLength(1);
  });
});
