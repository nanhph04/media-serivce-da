import { ForbiddenException } from '@shared/domain/exceptions/domain.exception';
import type { IVideoRepository } from '../../../videos/domain/repositories/video.repository';
import type { IChannelRepository } from '../../domain/repositories/channel.repository';
import { GetAdminChannelSummaryUseCase } from './get-admin-channel-summary.use-case';

describe('GetAdminChannelSummaryUseCase', () => {
  it('rejects non-admin callers', async () => {
    const useCase = new GetAdminChannelSummaryUseCase(
      createChannelRepository(),
      createVideoRepository(),
    );

    await expect(
      useCase.execute({ adminId: 'user-1', role: 'user' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('combines channel counts and video activity metrics', async () => {
    const useCase = new GetAdminChannelSummaryUseCase(
      createChannelRepository({
        totalChannels: 10,
        eligibleForMembership: 4,
        membershipClosedByAdmin: 2,
      }),
      createVideoRepository({
        activeCreators30d: 3,
        uploadingNow: 5,
      }),
    );

    await expect(
      useCase.execute({ adminId: 'admin-1', role: 'admin' }),
    ).resolves.toEqual({
      totalChannels: 10,
      activeCreators30d: 3,
      eligibleForMembership: 4,
      membershipClosedByAdmin: 2,
      uploadingNow: 5,
    });
  });
});

function createChannelRepository(
  counts = {
    totalChannels: 0,
    eligibleForMembership: 0,
    membershipClosedByAdmin: 0,
  },
): IChannelRepository {
  return {
    create: jest.fn(),
    delete: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    getAdminChannelCounts: jest.fn().mockResolvedValue(counts),
    update: jest.fn(),
  };
}

function createVideoRepository(
  metrics = { activeCreators30d: 0, uploadingNow: 0 },
): IVideoRepository {
  return {
    getAdminChannelVideoMetrics: jest.fn().mockResolvedValue(metrics),
  } as unknown as IVideoRepository;
}
