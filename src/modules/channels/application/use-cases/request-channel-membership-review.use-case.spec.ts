import { ForbiddenException } from '@shared/domain/exceptions/domain.exception';
import {
  ChannelEntity,
  ChannelStatus,
  MembershipReviewStatus,
} from '../../domain/entities/channel.entity';
import { RequestChannelMembershipReviewUseCase } from './request-channel-membership-review.use-case';

describe('RequestChannelMembershipReviewUseCase', () => {
  const channelRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  };
  const eligibilityService = {
    syncChannelEligibility: jest.fn(),
  };
  const useCase = new RequestChannelMembershipReviewUseCase(
    channelRepository as never,
    eligibilityService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('moves an eligible channel to pending review', async () => {
    const beforeSync = createChannel({ isEligibleForMembership: false });
    const afterSync = createChannel({
      isEligibleForMembership: true,
      membershipReviewStatus: MembershipReviewStatus.NOT_REQUESTED,
    });
    channelRepository.findById
      .mockResolvedValueOnce(beforeSync)
      .mockResolvedValueOnce(afterSync);
    eligibilityService.syncChannelEligibility.mockResolvedValue({
      isEligible: true,
      missingRequirements: [],
    });

    const result = await useCase.execute({
      channelId: 'channel-1',
      userId: 'user-1',
    });

    expect(result.membershipReviewStatus).toBe(MembershipReviewStatus.PENDING);
    expect(result.membershipRequestedAt).toBeInstanceOf(Date);
    expect(channelRepository.update).toHaveBeenCalledWith(afterSync);
  });

  it('rejects a channel that does not meet membership requirements', async () => {
    const channel = createChannel({ isEligibleForMembership: false });
    channelRepository.findById.mockResolvedValue(channel);
    eligibilityService.syncChannelEligibility.mockResolvedValue({
      isEligible: false,
      missingRequirements: ['Channel must have at least 3 ready videos'],
    });

    await expect(
      useCase.execute({
        channelId: 'channel-1',
        userId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(channelRepository.update).not.toHaveBeenCalled();
  });

  function createChannel(
    overrides: Partial<ConstructorParameters<typeof ChannelEntity>[0]> = {},
  ): ChannelEntity {
    return new ChannelEntity({
      id: 'channel-1',
      userId: 'user-1',
      name: 'Creator Channel',
      bio: 'Bio',
      avatarUrl: '',
      bannerUrl: '',
      status: ChannelStatus.ACTIVE,
      isEligibleForMembership: false,
      isMembershipClosedByAdmin: false,
      membershipReviewStatus: MembershipReviewStatus.NOT_REQUESTED,
      membershipRejectionReason: null,
      membershipReviewedBy: null,
      membershipReviewedAt: null,
      membershipRequestedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    });
  }
});
