import {
  toChannelDetailResponseDto,
  toCurrentChannelResponseDto,
} from './channel-response.mapper';

describe('toChannelDetailResponseDto', () => {
  it('maps membership eligibility breakdown into the response dto', () => {
    const result = toChannelDetailResponseDto({
      channel: {
        id: 'channel-1',
        userId: 'owner-1',
        name: 'Channel',
        bio: 'Bio',
        isEligibleForMembership: false,
        isMembershipClosedByAdmin: true,
        membershipReviewStatus: 'pending',
        membershipRejectionReason: null,
        membershipRequestedAt: new Date('2026-01-01T01:00:00.000Z'),
        membershipReviewedAt: null,
        avatarUrl: '',
        bannerUrl: '',
        status: 'active',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      membershipEligibility: {
        isEligible: false,
        readyVideoCount: 4,
        minReadyVideoCount: 5,
        totalVideoViews: 900,
        minTotalVideoViews: 1000,
        missingRequirements: ['Channel must have at least 1000 total views'],
      },
      membershipTiers: [],
      publicVideos: [],
    });

    expect(result.isEligibleForMembership).toBe(false);
    expect(result.isMembershipClosedByAdmin).toBe(true);
    expect(result.membershipReviewStatus).toBe('pending');
    expect(result.membershipRequestedAt).toBe('2026-01-01T01:00:00.000Z');
    expect(result.membershipEligibility).toEqual({
      isEligible: false,
      readyVideoCount: 4,
      minReadyVideoCount: 5,
      totalVideoViews: 900,
      minTotalVideoViews: 1000,
      missingRequirements: ['Channel must have at least 1000 total views'],
    });
  });
});

describe('toCurrentChannelResponseDto', () => {
  it('maps self channel response into dto', () => {
    expect(
      toCurrentChannelResponseDto({
        channelId: 'channel-1',
        userId: 'owner-1',
        status: 'inactive',
        isEligibleForMembership: true,
        isMembershipClosedByAdmin: true,
        membershipReviewStatus: 'approved',
        membershipRejectionReason: null,
        membershipRequestedAt: new Date('2026-01-01T01:00:00.000Z'),
        membershipReviewedAt: new Date('2026-01-02T01:00:00.000Z'),
      }),
    ).toEqual({
      channelId: 'channel-1',
      userId: 'owner-1',
      status: 'inactive',
      isEligibleForMembership: true,
      isMembershipClosedByAdmin: true,
      membershipReviewStatus: 'approved',
      membershipRejectionReason: null,
      membershipRequestedAt: '2026-01-01T01:00:00.000Z',
      membershipReviewedAt: '2026-01-02T01:00:00.000Z',
    });
  });
});
