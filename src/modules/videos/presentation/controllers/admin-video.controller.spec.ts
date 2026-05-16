import {
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { AdminVideoController } from './admin-video.controller';

describe('AdminVideoController', () => {
  const listAdminVideosUseCase = {
    execute: jest.fn(),
  };
  const getAdminVideoDetailUseCase = {
    execute: jest.fn(),
  };
  const moderateAdminVideoUseCase = {
    execute: jest.fn(),
  };
  const controller = new AdminVideoController(
    listAdminVideosUseCase as never,
    getAdminVideoDetailUseCase as never,
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

  it('maps admin video detail request to use case query', async () => {
    getAdminVideoDetailUseCase.execute.mockResolvedValue(buildAdminVideo());

    await controller.getVideoDetail('admin-1', 'admin', 'video-1');

    expect(getAdminVideoDetailUseCase.execute).toHaveBeenCalledWith({
      adminId: 'admin-1',
      role: 'admin',
      videoId: 'video-1',
    });
  });

  it('maps admin moderation request to use case command', async () => {
    moderateAdminVideoUseCase.execute.mockResolvedValue(
      buildAdminVideo({ status: VideoStatus.REJECTED }),
    );

    await controller.moderateVideo('admin-1', 'admin', 'video-1', {
      action: 'reject',
      reason: 'Policy issue',
    });

    expect(moderateAdminVideoUseCase.execute).toHaveBeenCalledWith({
      adminId: 'admin-1',
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
  ownerId: string;
  title: string;
  description: string;
  category: string;
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
} {
  return {
    id: 'video-1',
    channelId: 'channel-1',
    ownerId: 'owner-1',
    title: 'Video',
    description: 'Description',
    category: 'music',
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
  };
}
