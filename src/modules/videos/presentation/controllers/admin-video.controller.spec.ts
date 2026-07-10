import {
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { AdminVideoController } from './admin-video.controller';

describe('AdminVideoController', () => {
  const listAdminVideosUseCase = {
    execute: jest.fn(),
  };
  const getAdminVideoSummaryUseCase = {
    execute: jest.fn(),
  };
  const getAdminVideoDetailUseCase = {
    execute: jest.fn(),
  };
  const getAdminVideoPreviewUseCase = {
    execute: jest.fn(),
  };
  const moderateAdminVideoUseCase = {
    execute: jest.fn(),
  };
  const controller = new AdminVideoController(
    listAdminVideosUseCase as never,
    getAdminVideoSummaryUseCase as never,
    getAdminVideoDetailUseCase as never,
    getAdminVideoPreviewUseCase as never,
    moderateAdminVideoUseCase as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps headers and query to the list admin videos use case', async () => {
    listAdminVideosUseCase.execute.mockResolvedValue({
      items: [
        {
          id: 'video-1',
          channelId: 'channel-1',
          channelName: 'Channel',
          ownerId: 'owner-1',
          title: 'Video',
          description: 'Description',
          category: 'music',
          tags: ['action'],
          status: VideoStatus.READY,
          visibility: VideoVisibility.PUBLIC,
          price: 0,
          requiredTierLevel: null,
          thumbnailUrl: null,
          durationSeconds: null,
          resolutions: [],
          errorMessage: null,
          jobStatus: 'succeeded',
          jobStatusMessage: 'Video processing completed',
          failureReason: null,
          moderationDetails: null,
          viewCount: 10,
          publishedAt: new Date('2026-01-01T00:00:00.000Z'),
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          deleteReason: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });

    const result = await controller.listVideos('admin-1', 'admin', {
      page: 1,
      limit: 20,
      status: VideoStatus.READY,
      visibility: VideoVisibility.PUBLIC,
      channelId: 'channel-1',
      ownerId: 'owner-1',
      q: 'video',
    });

    expect(listAdminVideosUseCase.execute).toHaveBeenCalledWith({
      adminId: 'admin-1',
      role: 'admin',
      page: 1,
      limit: 20,
      status: VideoStatus.READY,
      visibility: VideoVisibility.PUBLIC,
      channelId: 'channel-1',
      ownerId: 'owner-1',
      q: 'video',
    });
    expect(result).toEqual({
      items: [
        expect.objectContaining({
          id: 'video-1',
          channelId: 'channel-1',
          channelName: 'Channel',
          ownerId: 'owner-1',
          publishedAt: '2026-01-01T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        }),
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });
  });

  it('maps admin video summary request to use case query', async () => {
    getAdminVideoSummaryUseCase.execute.mockResolvedValue({
      period: 'month',
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

    const result = await controller.getVideoSummary(
      'admin-1',
      'admin',
      'month',
    );

    expect(getAdminVideoSummaryUseCase.execute).toHaveBeenCalledWith({
      adminId: 'admin-1',
      period: 'month',
      role: 'admin',
    });
    expect(result).toEqual({
      period: 'month',
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
  });

  it('maps admin video detail request to use case query', async () => {
    getAdminVideoDetailUseCase.execute.mockResolvedValue(buildAdminVideo());

    const result = await controller.getVideoDetail(
      'admin-1',
      'admin',
      'video-1',
    );

    expect(getAdminVideoDetailUseCase.execute).toHaveBeenCalledWith({
      adminId: 'admin-1',
      role: 'admin',
      videoId: 'video-1',
    });
    expect(result).toEqual(
      expect.objectContaining({
        channelName: 'Channel',
        categoryTitle: 'Music',
        purchaseCount: 3,
      }),
    );
  });

  it('maps admin video preview request to use case query', async () => {
    getAdminVideoPreviewUseCase.execute.mockResolvedValue({
      videoId: 'video-1',
      previewUrl: 'http://localhost/raw.mp4?signature=abc',
      expiresAt: new Date('2026-01-01T00:15:00.000Z'),
      evidenceTimestampSeconds: 12,
      moderationDetails: {
        reason: 'NSFW score 0.72 at 00:12 requires manual review',
        confidence: 0.72,
        evidenceTimestampSeconds: 12,
        label: 'sexy',
        nsfwScore: 0.72,
        safeScore: 0.28,
        sampledFrameCount: 4,
        thresholds: { manual: 0.6, reject: 0.9 },
      },
    });

    const result = await controller.getVideoPreview(
      'admin-1',
      'admin',
      'video-1',
    );

    expect(getAdminVideoPreviewUseCase.execute).toHaveBeenCalledWith({
      adminId: 'admin-1',
      role: 'admin',
      videoId: 'video-1',
    });
    expect(result).toEqual(
      expect.objectContaining({
        videoId: 'video-1',
        previewUrl: 'http://localhost/raw.mp4?signature=abc',
        expiresAt: '2026-01-01T00:15:00.000Z',
        evidenceTimestampSeconds: 12,
      }),
    );
  });

  it('maps admin moderation request to use case command', async () => {
    moderateAdminVideoUseCase.execute.mockResolvedValue(
      buildAdminVideo({ status: VideoStatus.REJECTED }),
    );

    await controller.moderateVideo('admin-1', 'admin', 'trace-admin-1', 'video-1', {
      action: 'reject',
      reason: 'Policy issue',
    });

    expect(moderateAdminVideoUseCase.execute).toHaveBeenCalledWith({
      adminId: 'admin-1',
      traceId: 'trace-admin-1',
      role: 'admin',
      videoId: 'video-1',
      action: 'reject',
      reason: 'Policy issue',
    });
  });
});

function buildAdminVideo(input?: { status?: VideoStatus }): {
  id: string;
  channelId: string;
  channelName: string;
  ownerId: string;
  title: string;
  description: string;
  category: string;
  categoryTitle: string;
  tags: string[];
  status: VideoStatus;
  visibility: VideoVisibility;
  price: number;
  requiredTierLevel: null;
  thumbnailUrl: null;
  durationSeconds: null;
  resolutions: string[];
  errorMessage: null;
  jobStatus: string;
  jobStatusMessage: string;
  failureReason: null;
  moderationDetails: null;
  viewCount: number;
  publishedAt: Date;
  isDeleted: boolean;
  deletedAt: null;
  deletedBy: null;
  deleteReason: null;
  createdAt: Date;
  updatedAt: Date;
  purchaseCount: number;
} {
  return {
    id: 'video-1',
    channelId: 'channel-1',
    channelName: 'Channel',
    ownerId: 'owner-1',
    title: 'Video',
    description: 'Description',
    category: 'music',
    categoryTitle: 'Music',
    tags: ['action'],
    status: input?.status ?? VideoStatus.READY,
    visibility: VideoVisibility.PUBLIC,
    price: 0,
    requiredTierLevel: null,
    thumbnailUrl: null,
    durationSeconds: null,
    resolutions: [],
    errorMessage: null,
    jobStatus: 'succeeded',
    jobStatusMessage: 'Video processing completed',
    failureReason: null,
    moderationDetails: null,
    viewCount: 10,
    publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    deleteReason: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    purchaseCount: 3,
  };
}
