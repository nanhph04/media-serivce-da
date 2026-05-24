import { PATH_METADATA } from '@nestjs/common/constants';
import { MembershipReviewStatus } from '../../domain/entities/channel.entity';
import { AdminChannelController } from './admin-channel.controller';

describe('AdminChannelController', () => {
  const adminLockChannelUseCase = {
    execute: jest.fn(),
  };
  const getAdminChannelSummaryUseCase = {
    execute: jest.fn(),
  };
  const listAdminChannelsUseCase = {
    execute: jest.fn(),
  };
  const listMembershipReviewsUseCase = {
    execute: jest.fn(),
  };
  const reviewChannelMembershipUseCase = {
    execute: jest.fn(),
  };
  const moderateChannelMembershipUseCase = {
    execute: jest.fn(),
  };
  const controller = new AdminChannelController(
    adminLockChannelUseCase as never,
    getAdminChannelSummaryUseCase as never,
    listAdminChannelsUseCase as never,
    listMembershipReviewsUseCase as never,
    reviewChannelMembershipUseCase as never,
    moderateChannelMembershipUseCase as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exposes explicit admin channel membership moderation route', () => {
    expect(getRoutePaths('moderateMembership')).toEqual(':id/membership');
  });

  it('maps admin lock channel request to use case command', async () => {
    adminLockChannelUseCase.execute.mockResolvedValue({
      id: 'channel-1',
      userId: 'owner-1',
      name: 'Channel',
      bio: 'Bio',
      isEligibleForMembership: true,
      isMembershipClosedByAdmin: false,
      membershipReviewStatus: MembershipReviewStatus.APPROVED,
      membershipRejectionReason: null,
      membershipRequestedAt: new Date('2026-01-01T00:00:00.000Z'),
      membershipReviewedAt: new Date('2026-01-02T00:00:00.000Z'),
      avatarUrl: '',
      bannerUrl: '',
      status: 'suspended',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    await controller.updateChannelStatus('admin-1', 'channel-1', {
      action: 'lock',
    });

    expect(adminLockChannelUseCase.execute).toHaveBeenCalledWith({
      channelId: 'channel-1',
      adminId: 'admin-1',
      action: 'lock',
    });
  });

  it('maps admin channel list query to use case query', async () => {
    listAdminChannelsUseCase.execute.mockResolvedValue({
      items: [],
      pagination: {
        page: 2,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    });

    await controller.listChannels('admin-1', 'admin', {
      page: 2,
      limit: 10,
      status: 'active',
      ownerId: 'owner-1',
      q: 'music',
    });

    expect(listAdminChannelsUseCase.execute).toHaveBeenCalledWith({
      adminId: 'admin-1',
      role: 'admin',
      page: 2,
      limit: 10,
      status: 'active',
      ownerId: 'owner-1',
      q: 'music',
    });
  });

  it('lists pending membership reviews by default', async () => {
    listMembershipReviewsUseCase.execute.mockResolvedValue({
      items: [
        {
          channelId: 'channel-1',
          userId: 'owner-1',
          name: 'Channel',
          status: 'active',
          isEligibleForMembership: true,
          isMembershipClosedByAdmin: false,
          membershipReviewStatus: MembershipReviewStatus.PENDING,
          membershipRejectionReason: null,
          membershipRequestedAt: new Date('2026-01-01T00:00:00.000Z'),
          membershipReviewedAt: null,
          readyVideoCount: 5,
          minReadyVideoCount: 5,
          totalVideoViews: 1000,
          minTotalVideoViews: 1000,
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    await controller.listMembershipReviews('admin-1', 'admin', {});

    expect(listMembershipReviewsUseCase.execute).toHaveBeenCalledWith({
      adminId: 'admin-1',
      role: 'admin',
      status: MembershipReviewStatus.PENDING,
      page: 1,
      limit: 20,
    });
  });

  it('passes selected review status filter', async () => {
    listMembershipReviewsUseCase.execute.mockResolvedValue({
      items: [],
      pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
    });

    await controller.listMembershipReviews('admin-1', 'admin', {
      status: MembershipReviewStatus.REJECTED,
      page: 2,
      limit: 10,
    });

    expect(listMembershipReviewsUseCase.execute).toHaveBeenCalledWith({
      adminId: 'admin-1',
      role: 'admin',
      status: MembershipReviewStatus.REJECTED,
      page: 2,
      limit: 10,
    });
  });

  it('maps admin review request to use case command', async () => {
    reviewChannelMembershipUseCase.execute.mockResolvedValue({
      id: 'channel-1',
      userId: 'owner-1',
      name: 'Channel',
      bio: 'Bio',
      isEligibleForMembership: true,
      isMembershipClosedByAdmin: false,
      membershipReviewStatus: MembershipReviewStatus.APPROVED,
      membershipRejectionReason: null,
      membershipRequestedAt: new Date('2026-01-01T00:00:00.000Z'),
      membershipReviewedAt: new Date('2026-01-02T00:00:00.000Z'),
      avatarUrl: '',
      bannerUrl: '',
      status: 'active',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    await controller.reviewMembership('admin-1', 'admin', 'channel-1', {
      action: 'approve',
    });

    expect(reviewChannelMembershipUseCase.execute).toHaveBeenCalledWith({
      channelId: 'channel-1',
      adminId: 'admin-1',
      role: 'admin',
      action: 'approve',
      reason: undefined,
    });
  });

  it('maps admin membership moderation request to use case command', async () => {
    moderateChannelMembershipUseCase.execute.mockResolvedValue({
      id: 'channel-1',
      userId: 'owner-1',
      name: 'Channel',
      bio: 'Bio',
      isEligibleForMembership: true,
      isMembershipClosedByAdmin: false,
      membershipReviewStatus: MembershipReviewStatus.APPROVED,
      membershipRejectionReason: null,
      membershipRequestedAt: new Date('2026-01-01T00:00:00.000Z'),
      membershipReviewedAt: new Date('2026-01-02T00:00:00.000Z'),
      avatarUrl: '',
      bannerUrl: '',
      status: 'active',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    await controller.moderateMembership('admin-1', 'admin', 'channel-1', {
      action: 'approve',
    });

    expect(moderateChannelMembershipUseCase.execute).toHaveBeenCalledWith({
      channelId: 'channel-1',
      adminId: 'admin-1',
      action: 'approve',
    });
  });
});

function getRoutePaths(
  methodName: keyof AdminChannelController,
): string | string[] {
  return Reflect.getMetadata(
    PATH_METADATA,
    AdminChannelController.prototype[methodName],
  ) as string | string[];
}
