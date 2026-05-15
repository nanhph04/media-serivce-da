import {
  BadRequestException,
  ForbiddenException,
} from '@shared/domain/exceptions/domain.exception';
import { Category } from '../../../categories/domain/entities/category.entity';
import { CategoryStatus } from '../../../categories/domain/entities/category.entity';
import {
  VideoEntity,
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import type { IVideoRepository } from '../../domain/repositories/video.repository';
import { GetAdminReportsSummaryUseCase } from './get-admin-reports-summary.use-case';
import { ListAdminReportsUseCase } from './list-admin-reports.use-case';

describe('Admin report use cases', () => {
  it('rejects summary access for non-admin callers', async () => {
    const useCase = new GetAdminReportsSummaryUseCase(createVideoRepository());

    await expect(
      useCase.execute({ adminId: 'user-1', role: 'user' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns report summary for admin callers', async () => {
    const summary = {
      pendingReports: 2,
      pendingManualReviewVideos: 2,
      autoFlaggedVideos: 3,
      rejectedLast30d: 1,
      averageResolutionHours: null,
    };
    const useCase = new GetAdminReportsSummaryUseCase(
      createVideoRepository({ summary }),
    );

    await expect(
      useCase.execute({ adminId: 'admin-1', role: 'admin' }),
    ).resolves.toEqual(summary);
  });

  it('lists reports with default pagination and priority mapping', async () => {
    const video = buildVideo({
      confidence: 0.82,
      reason: 'NSFW content',
      statusChangedAt: new Date('2026-05-15T00:00:00.000Z'),
    });
    const findAdminReports = jest.fn().mockResolvedValue({
      items: [video],
      total: 1,
    });
    const useCase = new ListAdminReportsUseCase(
      createVideoRepository({ findAdminReports }),
    );

    const result = await useCase.execute({
      adminId: 'admin-1',
      role: 'admin',
    });

    expect(findAdminReports).toHaveBeenCalledWith({
      status: VideoStatus.PENDING_MANUAL_REVIEW,
      page: 1,
      limit: 20,
    });
    expect(result.items[0]).toEqual({
      id: video.id,
      targetVideoId: video.id,
      title: 'Video',
      reporterLabel: 'Auto moderation',
      reason: 'NSFW content',
      confidencePercent: 82,
      createdAt: new Date('2026-05-15T00:00:00.000Z'),
      priority: 'high',
    });
    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
  });

  it('clamps list limit and supports rejected status', async () => {
    const findAdminReports = jest.fn().mockResolvedValue({
      items: [],
      total: 0,
    });
    const useCase = new ListAdminReportsUseCase(
      createVideoRepository({ findAdminReports }),
    );

    await useCase.execute({
      adminId: 'admin-1',
      role: 'admin',
      status: 'rejected',
      page: 2,
      limit: 1000,
    });

    expect(findAdminReports).toHaveBeenCalledWith({
      status: VideoStatus.REJECTED,
      page: 2,
      limit: 100,
    });
  });

  it('rejects invalid report status filters', async () => {
    const useCase = new ListAdminReportsUseCase(createVideoRepository());

    await expect(
      useCase.execute({
        adminId: 'admin-1',
        role: 'admin',
        status: 'resolved',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

function createVideoRepository(input?: {
  findAdminReports?: jest.Mock;
  summary?: {
    pendingReports: number;
    pendingManualReviewVideos: number;
    autoFlaggedVideos: number;
    rejectedLast30d: number;
    averageResolutionHours: number | null;
  };
}): IVideoRepository {
  return {
    findAdminReports:
      input?.findAdminReports ??
      jest.fn().mockResolvedValue({
        items: [],
        total: 0,
      }),
    getAdminReportsSummary: jest.fn().mockResolvedValue(
      input?.summary ?? {
        pendingReports: 0,
        pendingManualReviewVideos: 0,
        autoFlaggedVideos: 0,
        rejectedLast30d: 0,
        averageResolutionHours: null,
      },
    ),
  } as unknown as IVideoRepository;
}

function buildVideo(input: {
  confidence?: number;
  reason?: string;
  statusChangedAt: Date;
}): VideoEntity {
  return new VideoEntity({
    id: 'video-1',
    channelId: 'channel-1',
    ownerId: 'owner-1',
    title: 'Video',
    description: '',
    category: new Category({
      id: 'category-1',
      name: 'Music',
      slug: 'music',
      description: null,
      parentId: null,
      status: CategoryStatus.ACTIVE,
      displayOrder: 0,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    }),
    tags: [],
    visibility: VideoVisibility.PUBLIC,
    status: VideoStatus.PENDING_MANUAL_REVIEW,
    price: 0,
    requiredTierLevel: null,
    rawFileKey: 'raw.mp4',
    masterPlaylistKey: null,
    thumbnailUrl: null,
    durationSeconds: null,
    resolutions: [],
    errorMessage: null,
    moderationDetails:
      input.confidence === undefined || input.reason === undefined
        ? null
        : {
            confidence: input.confidence,
            reason: input.reason,
            evidenceTimestampSeconds: null,
          },
    viewCount: 0,
    publishedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: input.statusChangedAt,
    statusChangedAt: input.statusChangedAt,
  });
}
