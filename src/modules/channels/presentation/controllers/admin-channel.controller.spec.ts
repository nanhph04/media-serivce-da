import { MembershipReviewStatus } from '../../domain/entities/channel.entity';
import { AdminChannelController } from './admin-channel.controller';

describe('AdminChannelController', () => {
  const getAdminChannelSummaryUseCase = {
    execute: jest.fn(),
  };
  const listMembershipReviewsUseCase = {
    execute: jest.fn(),
  };
  const reviewChannelMembershipUseCase = {
    execute: jest.fn(),
  };
  const controller = new AdminChannelController(
    getAdminChannelSummaryUseCase as never,
    listMembershipReviewsUseCase as never,
    reviewChannelMembershipUseCase as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists pending membership reviews by default', async () => {
    listMembershipReviewsUseCase.execute.mockResolvedValue([
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
    ]);

    await controller.listMembershipReviews('admin-1', 'admin', {});

    expect(listMembershipReviewsUseCase.execute).toHaveBeenCalledWith({
      adminId: 'admin-1',
      role: 'admin',
      status: MembershipReviewStatus.PENDING,
    });
  });

  it('passes selected review status filter', async () => {
    listMembershipReviewsUseCase.execute.mockResolvedValue([]);

    await controller.listMembershipReviews('admin-1', 'admin', {
      status: MembershipReviewStatus.REJECTED,
    });

    expect(listMembershipReviewsUseCase.execute).toHaveBeenCalledWith({
      adminId: 'admin-1',
      role: 'admin',
      status: MembershipReviewStatus.REJECTED,
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
});
