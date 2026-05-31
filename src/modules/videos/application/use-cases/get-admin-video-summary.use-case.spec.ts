import {
  BadRequestException,
  ForbiddenException,
} from '@shared/domain/exceptions/domain.exception';
import type { IVideoRepository } from '../../domain/repositories/video.repository';
import { GetAdminVideoSummaryUseCase } from './get-admin-video-summary.use-case';

describe('GetAdminVideoSummaryUseCase', () => {
  it('returns video summary for admin callers', async () => {
    const getAdminVideoSummary = jest.fn().mockResolvedValue({
      period: 'week',
      totalVideos: 10,
      readyVideos: 4,
      uploadingVideos: 2,
      pendingManualReviewVideos: 1,
      rejectedVideos: 1,
      failedVideos: 1,
      bannedVideos: 1,
      totalViews: 1234,
      newVideos: 3,
      newViews: 321,
      newPurchases: 12,
    });
    const useCase = new GetAdminVideoSummaryUseCase(
      createVideoRepository({ getAdminVideoSummary }),
    );

    await expect(
      useCase.execute({ adminId: 'admin-1', period: 'week', role: 'admin' }),
    ).resolves.toEqual({
      period: 'week',
      totalVideos: 10,
      readyVideos: 4,
      uploadingVideos: 2,
      pendingManualReviewVideos: 1,
      rejectedVideos: 1,
      failedVideos: 1,
      bannedVideos: 1,
      totalViews: 1234,
      newVideos: 3,
      newViews: 321,
      newPurchases: 12,
    });
    expect(getAdminVideoSummary).toHaveBeenCalledWith('week');
  });

  it('defaults period to all', async () => {
    const getAdminVideoSummary = jest.fn().mockResolvedValue({
      period: 'all',
      totalVideos: 0,
      readyVideos: 0,
      uploadingVideos: 0,
      pendingManualReviewVideos: 0,
      rejectedVideos: 0,
      failedVideos: 0,
      bannedVideos: 0,
      totalViews: 0,
      newVideos: 0,
      newViews: 0,
      newPurchases: 0,
    });
    const useCase = new GetAdminVideoSummaryUseCase(
      createVideoRepository({ getAdminVideoSummary }),
    );

    await useCase.execute({ adminId: 'admin-1', role: 'admin' });

    expect(getAdminVideoSummary).toHaveBeenCalledWith('all');
  });

  it('rejects invalid periods', async () => {
    const useCase = new GetAdminVideoSummaryUseCase(createVideoRepository());

    await expect(
      useCase.execute({ adminId: 'admin-1', period: 'year', role: 'admin' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects non-admin callers', async () => {
    const useCase = new GetAdminVideoSummaryUseCase(createVideoRepository());

    await expect(
      useCase.execute({ adminId: 'user-1', role: 'user' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects empty admin id', async () => {
    const useCase = new GetAdminVideoSummaryUseCase(createVideoRepository());

    await expect(
      useCase.execute({ adminId: ' ', role: 'admin' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

function createVideoRepository(input?: {
  getAdminVideoSummary?: jest.Mock;
}): IVideoRepository {
  return {
    getAdminVideoSummary:
      input?.getAdminVideoSummary ??
      jest.fn().mockResolvedValue({
        period: 'all',
        totalVideos: 0,
        readyVideos: 0,
        uploadingVideos: 0,
        pendingManualReviewVideos: 0,
        rejectedVideos: 0,
        failedVideos: 0,
        bannedVideos: 0,
        totalViews: 0,
        newVideos: 0,
        newViews: 0,
        newPurchases: 0,
      }),
  } as unknown as IVideoRepository;
}
