import {
  BadRequestException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  Category,
  CategoryStatus,
} from '../../../categories/domain/entities/category.entity';
import {
  ChannelEntity,
  ChannelStatus,
} from '../../../channels/domain/entities/channel.entity';
import type { IChannelRepository } from '../../../channels/domain/repositories/channel.repository';
import {
  VideoEntity,
  VideoStatus,
  VideoThumbnailSource,
  VideoThumbnailStatus,
  VideoVisibility,
} from '../../../videos/domain/entities/video.entity';
import type { IVideoRepository } from '../../../videos/domain/repositories/video.repository';
import {
  ContentReportEntity,
  ContentReportStatus,
  ContentReportTargetType,
} from '../../domain/entities/content-report.entity';
import type { IContentReportRepository } from '../../domain/repositories/content-report.repository';
import { ListAdminReportsUseCase } from './list-admin-reports.use-case';
import { ReportChannelUseCase } from './report-channel.use-case';
import { ReportVideoUseCase } from './report-video.use-case';

describe('Content report use cases', () => {
  it('reports a video with reason and timestamp', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const useCase = new ReportVideoUseCase(
      createReportRepository({ save }),
      createVideoRepository({ video: buildVideo() }),
    );

    const result = await useCase.execute({
      reporterUserId: 'user-1',
      videoId: 'video-1',
      reason: '  Violation reason  ',
      evidenceTimestampSeconds: 42,
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      targetType: ContentReportTargetType.VIDEO,
      reporterUserId: 'user-1',
      targetVideoId: 'video-1',
      targetChannelId: 'channel-1',
      reason: 'Violation reason',
      evidenceTimestampSeconds: 42,
      status: ContentReportStatus.PENDING,
    });
  });

  it('rejects an empty video report reason', async () => {
    const useCase = new ReportVideoUseCase(
      createReportRepository(),
      createVideoRepository({ video: buildVideo() }),
    );

    await expect(
      useCase.execute({
        reporterUserId: 'user-1',
        videoId: 'video-1',
        reason: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a missing video target', async () => {
    const useCase = new ReportVideoUseCase(
      createReportRepository(),
      createVideoRepository({ video: null }),
    );

    await expect(
      useCase.execute({
        reporterUserId: 'user-1',
        videoId: 'missing-video',
        reason: 'Violation reason',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a timestamp that exceeds video duration', async () => {
    const useCase = new ReportVideoUseCase(
      createReportRepository(),
      createVideoRepository({ video: buildVideo({ durationSeconds: 60 }) }),
    );

    await expect(
      useCase.execute({
        reporterUserId: 'user-1',
        videoId: 'video-1',
        reason: 'Violation reason',
        evidenceTimestampSeconds: 61,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns an existing pending duplicate instead of creating a new report', async () => {
    const existing = ContentReportEntity.createVideoReport({
      reporterUserId: 'user-1',
      targetVideoId: 'video-1',
      targetChannelId: 'channel-1',
      reason: 'Existing reason',
      evidenceTimestampSeconds: 10,
    });
    const save = jest.fn().mockResolvedValue(undefined);
    const useCase = new ReportVideoUseCase(
      createReportRepository({ duplicate: existing, save }),
      createVideoRepository({ video: buildVideo() }),
    );

    const result = await useCase.execute({
      reporterUserId: 'user-1',
      videoId: 'video-1',
      reason: 'New reason',
      evidenceTimestampSeconds: 12,
    });

    expect(save).not.toHaveBeenCalled();
    expect(result.id).toBe(existing.id);
    expect(result.reason).toBe('Existing reason');
  });

  it('reports a channel with a video id that belongs to the channel', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const useCase = new ReportChannelUseCase(
      createReportRepository({ save }),
      createChannelRepository({ channel: buildChannel() }),
      createVideoRepository({ video: buildVideo({ title: 'Bad Video' }) }),
    );

    const result = await useCase.execute({
      reporterUserId: 'user-1',
      channelId: 'channel-1',
      reason: 'Channel issue',
      reportedVideoId: 'video-1',
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      targetType: ContentReportTargetType.CHANNEL,
      targetVideoId: null,
      targetChannelId: 'channel-1',
      contextVideoId: 'video-1',
      contextVideoTitle: 'Bad Video',
    });
  });

  it('rejects a channel report video id that belongs to another channel', async () => {
    const useCase = new ReportChannelUseCase(
      createReportRepository(),
      createChannelRepository({ channel: buildChannel() }),
      createVideoRepository({
        video: buildVideo({ channelId: 'other-channel' }),
      }),
    );

    await expect(
      useCase.execute({
        reporterUserId: 'user-1',
        channelId: 'channel-1',
        reason: 'Channel issue',
        reportedVideoId: 'video-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reports a channel with a free-text video title', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const useCase = new ReportChannelUseCase(
      createReportRepository({ save }),
      createChannelRepository({ channel: buildChannel() }),
      createVideoRepository(),
    );

    const result = await useCase.execute({
      reporterUserId: 'user-1',
      channelId: 'channel-1',
      reason: 'Channel issue',
      reportedVideoTitle: '  Suspicious upload  ',
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(result.contextVideoId).toBeNull();
    expect(result.contextVideoTitle).toBe('Suspicious upload');
  });

  it('rejects a missing channel target', async () => {
    const useCase = new ReportChannelUseCase(
      createReportRepository(),
      createChannelRepository({ channel: null }),
      createVideoRepository(),
    );

    await expect(
      useCase.execute({
        reporterUserId: 'user-1',
        channelId: 'missing-channel',
        reason: 'Channel issue',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('keeps rejected admin report queries mapped to synthetic reports by default', async () => {
    const findAdminReports = jest.fn().mockResolvedValue({
      items: [buildVideo({ status: VideoStatus.REJECTED })],
      total: 1,
    });
    const useCase = new ListAdminReportsUseCase(
      createReportRepository(),
      createVideoRepository({ findAdminReports }),
    );

    const result = await useCase.execute({
      adminId: 'admin-1',
      role: 'admin',
      status: 'rejected',
    });

    expect(findAdminReports).toHaveBeenCalledWith({
      status: VideoStatus.REJECTED,
      page: 1,
      limit: 20,
    });
    expect(result.items[0]?.source).toBe('auto_moderation');
    expect(result.items[0]?.status).toBe('rejected');
  });
});

function createReportRepository(input?: {
  duplicate?: ContentReportEntity | null;
  save?: jest.Mock;
}): IContentReportRepository {
  return {
    save: input?.save ?? jest.fn().mockResolvedValue(undefined),
    findById: jest.fn().mockResolvedValue(null),
    findPendingByReporterAndTarget: jest
      .fn()
      .mockResolvedValue(input?.duplicate ?? null),
    findPage: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    getSummary: jest.fn().mockResolvedValue({
      pendingUserReports: 0,
      pendingVideoReports: 0,
      pendingChannelReports: 0,
      resolvedUserReports: 0,
      dismissedUserReports: 0,
    }),
  };
}

function createVideoRepository(input?: {
  video?: VideoEntity | null;
  findAdminReports?: jest.Mock;
}): IVideoRepository {
  return {
    findBasicById: jest.fn().mockResolvedValue(input?.video ?? null),
    findAdminReports:
      input?.findAdminReports ??
      jest.fn().mockResolvedValue({ items: [], total: 0 }),
  } as unknown as IVideoRepository;
}

function createChannelRepository(input?: {
  channel?: ChannelEntity | null;
}): IChannelRepository {
  return {
    findById: jest.fn().mockResolvedValue(input?.channel ?? null),
  } as unknown as IChannelRepository;
}

function buildVideo(input?: {
  channelId?: string;
  title?: string;
  durationSeconds?: number | null;
  status?: VideoStatus;
}): VideoEntity {
  return new VideoEntity({
    id: 'video-1',
    channelId: input?.channelId ?? 'channel-1',
    ownerId: 'owner-1',
    title: input?.title ?? 'Video',
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
    status: input?.status ?? VideoStatus.READY,
    price: 0,
    requiredTierLevel: null,
    rawFileKey: 'raw.mp4',
    masterPlaylistKey: 'master.m3u8',
    thumbnailObjectKey: null,
    thumbnailUrl: null,
    thumbnailSource: VideoThumbnailSource.AUTO,
    thumbnailStatus: VideoThumbnailStatus.PENDING,
    thumbnailGeneratedAt: null,
    thumbnailError: null,
    durationSeconds: input?.durationSeconds ?? 120,
    resolutions: [],
    errorMessage: null,
    moderationDetails: null,
    viewCount: 0,
    publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    statusChangedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

function buildChannel(): ChannelEntity {
  return new ChannelEntity({
    id: 'channel-1',
    userId: 'owner-1',
    name: 'Channel',
    bio: '',
    avatarUrl: '',
    bannerUrl: '',
    status: ChannelStatus.ACTIVE,
    isEligibleForMembership: false,
    isMembershipClosedByAdmin: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}
