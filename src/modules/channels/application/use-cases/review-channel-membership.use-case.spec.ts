import {
  BadRequestException,
  ForbiddenException,
} from '@shared/domain/exceptions/domain.exception';
import {
  ChannelEntity,
  ChannelStatus,
  MembershipReviewStatus,
} from '../../domain/entities/channel.entity';
import { ReviewChannelMembershipUseCase } from './review-channel-membership.use-case';

describe('ReviewChannelMembershipUseCase', () => {
  const channelRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  };
  const useCase = new ReviewChannelMembershipUseCase(
    channelRepository as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    channelRepository.findById.mockResolvedValue(
      buildChannel({
        isEligibleForMembership: true,
        membershipReviewStatus: MembershipReviewStatus.PENDING,
      }),
    );
    channelRepository.update.mockResolvedValue(undefined);
  });

  it('approves a pending membership review', async () => {
    const result = await useCase.execute({
      channelId: 'channel-1',
      adminId: 'admin-1',
      role: 'admin',
      action: 'approve',
    });

    expect(result.membershipReviewStatus).toBe(MembershipReviewStatus.APPROVED);
    expect(result.membershipRejectionReason).toBeNull();
    expect(result.membershipReviewedAt).toBeInstanceOf(Date);
    expect(channelRepository.update).toHaveBeenCalledWith(
      expect.any(ChannelEntity),
    );
  });

  it('rejects a pending membership review with a required reason', async () => {
    const result = await useCase.execute({
      channelId: 'channel-1',
      adminId: 'admin-1',
      role: 'admin',
      action: 'reject',
      reason: 'Policy issue',
    });

    expect(result.membershipReviewStatus).toBe(MembershipReviewStatus.REJECTED);
    expect(result.membershipRejectionReason).toBe('Policy issue');
    expect(result.membershipReviewedAt).toBeInstanceOf(Date);
  });

  it('rejects non-admin callers', async () => {
    await expect(
      useCase.execute({
        channelId: 'channel-1',
        adminId: 'user-1',
        role: 'user',
        action: 'approve',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a channel that is not eligible', async () => {
    channelRepository.findById.mockResolvedValue(
      buildChannel({
        isEligibleForMembership: false,
        membershipReviewStatus: MembershipReviewStatus.NOT_REQUESTED,
      }),
    );

    await expect(
      useCase.execute({
        channelId: 'channel-1',
        adminId: 'admin-1',
        role: 'admin',
        action: 'approve',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an empty rejection reason', async () => {
    await expect(
      useCase.execute({
        channelId: 'channel-1',
        adminId: 'admin-1',
        role: 'admin',
        action: 'reject',
        reason: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
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
    isEligibleForMembership: false,
    isMembershipClosedByAdmin: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}
