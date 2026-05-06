import { NotFoundException } from '@shared/domain/exceptions/domain.exception';
import { ChannelEntity, ChannelStatus } from '../../domain/entities/channel.entity';
import { ChannelMembershipEligibilityService } from './channel-membership-eligibility.service';

describe('ChannelMembershipEligibilityService', () => {
  const channelRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  };
  const videoQueryService = {
    getChannelMembershipEligibilityMetrics: jest.fn(),
  };
  const config = {
    getMinReadyVideosForMembership: jest.fn(),
    getMinTotalViewsForMembership: jest.fn(),
  };

  const service = new ChannelMembershipEligibilityService(
    channelRepository as never,
    videoQueryService as never,
    config as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    config.getMinReadyVideosForMembership.mockReturnValue(5);
    config.getMinTotalViewsForMembership.mockReturnValue(1000);
  });

  it('returns eligible when ready videos and total views reach thresholds', async () => {
    channelRepository.findById.mockResolvedValue(buildChannel());
    videoQueryService.getChannelMembershipEligibilityMetrics.mockResolvedValue({
      readyVideoCount: 5,
      totalVideoViews: 1000,
    });

    await expect(
      service.getChannelEligibility('channel-1'),
    ).resolves.toEqual({
      isEligible: true,
      readyVideoCount: 5,
      minReadyVideoCount: 5,
      totalVideoViews: 1000,
      minTotalVideoViews: 1000,
      missingRequirements: [],
    });
  });

  it('returns missing requirements when metrics are below thresholds', async () => {
    channelRepository.findById.mockResolvedValue(buildChannel());
    videoQueryService.getChannelMembershipEligibilityMetrics.mockResolvedValue({
      readyVideoCount: 4,
      totalVideoViews: 999,
    });

    await expect(
      service.getChannelEligibility('channel-1'),
    ).resolves.toEqual({
      isEligible: false,
      readyVideoCount: 4,
      minReadyVideoCount: 5,
      totalVideoViews: 999,
      minTotalVideoViews: 1000,
      missingRequirements: [
        'Channel must have at least 5 ready videos',
        'Channel must have at least 1000 total views',
      ],
    });
  });

  it('syncs persisted eligibility on the channel entity', async () => {
    const channel = buildChannel({ isEligibleForMembership: false });
    channelRepository.findById.mockResolvedValue(channel);
    channelRepository.update.mockResolvedValue(undefined);
    videoQueryService.getChannelMembershipEligibilityMetrics.mockResolvedValue({
      readyVideoCount: 6,
      totalVideoViews: 1500,
    });

    await service.syncChannelEligibility('channel-1');

    expect(channel.isEligibleForMembership).toBe(true);
    expect(channelRepository.update).toHaveBeenCalledWith(channel);
  });

  it('does not revoke persisted eligibility after thresholds fall again', async () => {
    const channel = buildChannel({ isEligibleForMembership: true });
    channelRepository.findById.mockResolvedValue(channel);
    videoQueryService.getChannelMembershipEligibilityMetrics.mockResolvedValue({
      readyVideoCount: 1,
      totalVideoViews: 5,
    });

    const result = await service.syncChannelEligibility('channel-1');

    expect(result.isEligible).toBe(false);
    expect(channel.isEligibleForMembership).toBe(true);
    expect(channelRepository.update).not.toHaveBeenCalled();
  });

  it('throws not found when the channel does not exist', async () => {
    channelRepository.findById.mockResolvedValue(null);

    await expect(service.getChannelEligibility('channel-1')).rejects.toThrow(
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
    isMembershipClosedByAdmin: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}
