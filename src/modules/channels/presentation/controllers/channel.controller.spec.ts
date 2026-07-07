import { PATH_METADATA } from '@nestjs/common/constants';
import { ChannelStatus } from '../../domain/entities/channel.entity';
import { ChannelController } from './channel.controller';

describe('ChannelController', () => {
  const createChannelUseCase = {
    execute: jest.fn(),
  };
  const updateChannelUseCase = {
    execute: jest.fn(),
  };
  const getCurrentChannelUseCase = {
    execute: jest.fn(),
  };
  const getChannelDetailUseCase = {
    execute: jest.fn(),
  };
  const getMembershipStatusUseCase = {
    execute: jest.fn(),
  };
  const requestChannelMembershipReviewUseCase = {
    execute: jest.fn(),
  };
  const uploadChannelImageUseCase = {
    execute: jest.fn(),
  };

  const controller = new ChannelController(
    createChannelUseCase as never,
    updateChannelUseCase as never,
    getCurrentChannelUseCase as never,
    getChannelDetailUseCase as never,
    getMembershipStatusUseCase as never,
    requestChannelMembershipReviewUseCase as never,
    uploadChannelImageUseCase as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exposes canonical current user and channel routes', () => {
    expect(getRoutePaths('createChannel')).toEqual('me/channel');
    expect(getRoutePaths('updateChannel')).toEqual('me/channel');
    expect(getRoutePaths('getCurrentChannel')).toEqual('me/channel');
    expect(getRoutePaths('requestMembershipReview')).toEqual(
      'channels/:id/membership-review-requests',
    );
    expect(getRoutePaths('uploadAvatar')).toEqual('me/channel/avatar');
    expect(getRoutePaths('uploadBanner')).toEqual('me/channel/banner');
  });

  it('returns the current user channel summary', async () => {
    getCurrentChannelUseCase.execute.mockResolvedValue({
      channelId: 'channel-1',
      userId: 'owner-1',
      status: ChannelStatus.INACTIVE,
      isEligibleForMembership: false,
      isMembershipClosedByAdmin: true,
      membershipReviewStatus: 'pending',
      membershipRejectionReason: null,
      membershipRequestedAt: new Date('2026-01-01T00:00:00.000Z'),
      membershipReviewedAt: null,
    });

    const result = await controller.getCurrentChannel('owner-1');

    expect(getCurrentChannelUseCase.execute).toHaveBeenCalledWith({
      userId: 'owner-1',
    });
    expect(result).toEqual({
      channelId: 'channel-1',
      userId: 'owner-1',
      status: ChannelStatus.INACTIVE,
      isEligibleForMembership: false,
      isMembershipClosedByAdmin: true,
      membershipReviewStatus: 'pending',
      membershipRejectionReason: null,
      membershipRequestedAt: '2026-01-01T00:00:00.000Z',
      membershipReviewedAt: null,
    });
  });

  it('passes optional viewer identity to channel detail use case', async () => {
    getChannelDetailUseCase.execute.mockResolvedValue(buildChannelDetail());

    await (
      controller.getChannelDetail as (
        channelId: string,
        viewerUserId?: string,
      ) => Promise<unknown>
    )('channel-1', 'owner-1');

    expect(getChannelDetailUseCase.execute).toHaveBeenCalledWith({
      channelId: 'channel-1',
      viewerUserId: 'owner-1',
    });
  });
});

function getRoutePaths(methodName: keyof ChannelController): string | string[] {
  return Reflect.getMetadata(
    PATH_METADATA,
    ChannelController.prototype[methodName],
  ) as string | string[];
}

function buildChannelDetail(): unknown {
  const date = new Date('2026-01-01T00:00:00.000Z');

  return {
    channel: {
      id: 'channel-1',
      userId: 'owner-1',
      name: 'Channel',
      bio: 'Bio',
      isEligibleForMembership: false,
      isMembershipClosedByAdmin: false,
      membershipReviewStatus: 'not_requested',
      membershipRejectionReason: null,
      membershipRequestedAt: null,
      membershipReviewedAt: null,
      avatarUrl: '',
      bannerUrl: '',
      status: ChannelStatus.ACTIVE,
      createdAt: date,
      updatedAt: date,
    },
    membershipEligibility: {
      isEligible: false,
      readyVideoCount: 0,
      minReadyVideoCount: 5,
      totalVideoViews: 0,
      minTotalVideoViews: 1000,
      missingRequirements: [],
    },
    membershipTiers: [],
    publicVideos: [],
  };
}
