import { toChannelDetailResponseDto } from './channel-response.mapper';

describe('toChannelDetailResponseDto', () => {
  it('maps membership eligibility breakdown into the response dto', () => {
    const result = toChannelDetailResponseDto({
      channel: {
        id: 'channel-1',
        userId: 'owner-1',
        name: 'Channel',
        bio: 'Bio',
        isEligibleForMembership: false,
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
