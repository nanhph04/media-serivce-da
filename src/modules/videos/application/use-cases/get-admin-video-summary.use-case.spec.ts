import {
  BadRequestException,
  ForbiddenException,
} from '@shared/domain/exceptions/domain.exception';
import type { IVideoRepository } from '../../domain/repositories/video.repository';
import { GetAdminVideoSummaryUseCase } from './get-admin-video-summary.use-case';

describe('GetAdminVideoSummaryUseCase', () => {
  it('returns video summary for admin callers', async () => {
    const getAdminVideoSummary = jest.fn().mockResolvedValue({
      totalVideos: 10,
      readyVideos: 4,
      uploadingVideos: 2,
      pendingManualReviewVideos: 1,
      rejectedVideos: 1,
      failedVideos: 1,
      bannedVideos: 1,
      totalViews: 1234,
    });
    const useCase = new GetAdminVideoSummaryUseCase(
      createVideoRepository({ getAdminVideoSummary }),
    );

    await expect(
      useCase.execute({ adminId: 'admin-1', role: 'admin' }),
    ).resolves.toEqual({
      totalVideos: 10,
      readyVideos: 4,
      uploadingVideos: 2,
      pendingManualReviewVideos: 1,
      rejectedVideos: 1,
      failedVideos: 1,
      bannedVideos: 1,
      totalViews: 1234,
    });
    expect(getAdminVideoSummary).toHaveBeenCalledTimes(1);
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
        totalVideos: 0,
        readyVideos: 0,
        uploadingVideos: 0,
        pendingManualReviewVideos: 0,
        rejectedVideos: 0,
        failedVideos: 0,
        bannedVideos: 0,
        totalViews: 0,
      }),
  } as unknown as IVideoRepository;
}
