import {
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { VideosController } from './videos.controller';
import { Readable } from 'stream';

describe('VideosController', () => {
  const initVideoUploadUseCase = {
    execute: jest.fn(),
  };
  const confirmVideoUploadUseCase = {
    execute: jest.fn(),
  };
  const replaceVideoUploadUseCase = {
    execute: jest.fn(),
  };
  const cancelVideoUploadUseCase = {
    execute: jest.fn(),
  };
  const deleteFailedVideoUseCase = {
    execute: jest.fn(),
  };
  const playVideoUseCase = {
    execute: jest.fn(),
  };
  const updateVideoProgressUseCase = {
    execute: jest.fn(),
  };
  const refreshPlaybackTokenUseCase = {
    execute: jest.fn(),
  };
  const getContinueWatchingUseCase = {
    execute: jest.fn(),
  };
  const getLatestVideosUseCase = {
    execute: jest.fn(),
  };
  const getPurchasedVideosUseCase = {
    execute: jest.fn(),
  };
  const getStudioVideoDetailUseCase = {
    execute: jest.fn(),
  };
  const getStudioVideosUseCase = {
    execute: jest.fn(),
  };
  const getVideosByCategoryUseCase = {
    execute: jest.fn(),
  };
  const getSubscribedVideosUseCase = {
    execute: jest.fn(),
  };
  const getVideoMetadataUseCase = {
    execute: jest.fn(),
  };
  const getVideoThumbnailUseCase = {
    execute: jest.fn(),
  };
  const updateVideoMetadataUseCase = {
    execute: jest.fn(),
  };
  const unpublishVideoUseCase = {
    execute: jest.fn(),
  };
  const searchPublicVideosUseCase = {
    execute: jest.fn(),
  };
  const controller = new VideosController(
    initVideoUploadUseCase as never,
    confirmVideoUploadUseCase as never,
    replaceVideoUploadUseCase as never,
    cancelVideoUploadUseCase as never,
    deleteFailedVideoUseCase as never,
    playVideoUseCase as never,
    updateVideoProgressUseCase as never,
    refreshPlaybackTokenUseCase as never,
    getContinueWatchingUseCase as never,
    getLatestVideosUseCase as never,
    getPurchasedVideosUseCase as never,
    getStudioVideoDetailUseCase as never,
    getStudioVideosUseCase as never,
    getVideosByCategoryUseCase as never,
    getSubscribedVideosUseCase as never,
    getVideoMetadataUseCase as never,
    getVideoThumbnailUseCase as never,
    updateVideoMetadataUseCase as never,
    unpublishVideoUseCase as never,
    searchPublicVideosUseCase as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns video metadata response dto', async () => {
    getVideoMetadataUseCase.execute.mockResolvedValue(buildMetadata());

    const result = await controller.getMetadata('video-1');

    expect(getVideoMetadataUseCase.execute).toHaveBeenCalledWith('video-1');
    expect(result).toEqual({
      id: 'video-1',
      channelId: 'channel-1',
      channelName: 'Cinema Labs',
      avatarUrlChannel: 'https://cdn.example.com/channel-avatar.jpg',
      membershipTiers: [
        {
          id: 'tier-1',
          channelId: 'channel-1',
          name: 'Supporter',
          level: 1,
          priceCoin: 100,
          isAcceptingNew: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      title: 'Video',
      description: 'Description',
      categoryId: 'category-1',
      category: 'music',
      tagIds: ['tag-1'],
      tags: ['action'],
      thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
      viewCount: 10,
      price: 50,
      requiredTierLevel: 2,
      status: VideoStatus.READY,
      visibility: VideoVisibility.PUBLIC,
      errorMessage: null,
      jobStatus: 'succeeded',
      jobStatusMessage: 'Video processing completed',
      failureReason: null,
      moderationDetails: null,
      publishedAt: '2026-01-01T00:00:00.000Z',
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      deleteReason: null,
      updatedAt: '2026-01-02T00:00:00.000Z',
    });
  });

  it('initializes upload using current user channel context', async () => {
    initVideoUploadUseCase.execute.mockResolvedValue({
      videoId: 'video-1',
      status: VideoStatus.DRAFT,
      rawFileKey: 'uploads/raw/channel-1/file.mp4',
      bucket: 'raw-videos',
      uploadUrl: 'https://upload.example.com',
    });

    const result = await controller.initUpload('owner-1', {
      channelId: 'legacy-channel-1',
      title: 'Video',
      description: 'Description',
      categoryId: 'category-1',
      tagIds: ['tag-1'],
      visibility: 'public',
      price: 0,
      requiredTierLevel: null,
    });

    expect(initVideoUploadUseCase.execute).toHaveBeenCalledWith({
      userId: 'owner-1',
      title: 'Video',
      description: 'Description',
      categoryId: 'category-1',
      tagIds: ['tag-1'],
      visibility: 'public',
      price: 0,
      requiredTierLevel: null,
    });
    expect(result).toEqual({
      videoId: 'video-1',
      status: VideoStatus.DRAFT,
      rawFileKey: 'uploads/raw/channel-1/file.mp4',
      bucket: 'raw-videos',
      uploadUrl: 'https://upload.example.com',
    });
  });

  it('initializes upload without legacy channel id', async () => {
    initVideoUploadUseCase.execute.mockResolvedValue({
      videoId: 'video-2',
      status: VideoStatus.DRAFT,
      rawFileKey: 'uploads/raw/channel-1/file-2.mp4',
      bucket: 'raw-videos',
      uploadUrl: 'https://upload.example.com/2',
    });

    const result = await controller.initUpload('owner-1', {
      title: 'Video 2',
      description: '',
      categoryId: 'category-2',
      tagIds: [],
      visibility: 'public',
      price: 0,
      requiredTierLevel: null,
    });

    expect(initVideoUploadUseCase.execute).toHaveBeenCalledWith({
      userId: 'owner-1',
      title: 'Video 2',
      description: '',
      categoryId: 'category-2',
      tagIds: [],
      visibility: 'public',
      price: 0,
      requiredTierLevel: null,
    });
    expect(result).toEqual({
      videoId: 'video-2',
      status: VideoStatus.DRAFT,
      rawFileKey: 'uploads/raw/channel-1/file-2.mp4',
      bucket: 'raw-videos',
      uploadUrl: 'https://upload.example.com/2',
    });
  });

  it('replaces a draft upload for the current user', async () => {
    replaceVideoUploadUseCase.execute.mockResolvedValue({
      videoId: 'video-1',
      status: VideoStatus.DRAFT,
      rawFileKey: 'uploads/raw/channel-1/file-2.mp4',
      bucket: 'raw-videos',
      uploadUrl: 'https://upload.example.com/2',
    });

    const result = await controller.replaceUpload('owner-1', 'video-1');

    expect(replaceVideoUploadUseCase.execute).toHaveBeenCalledWith({
      userId: 'owner-1',
      videoId: 'video-1',
    });
    expect(result).toEqual({
      videoId: 'video-1',
      status: VideoStatus.DRAFT,
      rawFileKey: 'uploads/raw/channel-1/file-2.mp4',
      bucket: 'raw-videos',
      uploadUrl: 'https://upload.example.com/2',
    });
  });

  it('cancels a draft upload for the current user', async () => {
    cancelVideoUploadUseCase.execute.mockResolvedValue({
      videoId: 'video-1',
      cancelled: true,
    });

    const result = await controller.cancelUpload('owner-1', 'video-1');

    expect(cancelVideoUploadUseCase.execute).toHaveBeenCalledWith({
      userId: 'owner-1',
      videoId: 'video-1',
    });
    expect(result).toEqual({
      videoId: 'video-1',
      cancelled: true,
    });
  });

  it('deletes a failed video for the current user', async () => {
    deleteFailedVideoUseCase.execute.mockResolvedValue({
      videoId: 'video-1',
      deleted: true,
    });

    const result = await controller.deleteFailedVideo('owner-1', 'video-1');

    expect(deleteFailedVideoUseCase.execute).toHaveBeenCalledWith({
      userId: 'owner-1',
      videoId: 'video-1',
    });
    expect(result).toEqual({
      videoId: 'video-1',
      deleted: true,
    });
  });

  it('unpublishes a ready video for the current user', async () => {
    unpublishVideoUseCase.execute.mockResolvedValue({
      videoId: 'video-1',
      unpublished: true,
    });

    const result = await controller.unpublishVideo('owner-1', 'video-1');

    expect(unpublishVideoUseCase.execute).toHaveBeenCalledWith({
      userId: 'owner-1',
      videoId: 'video-1',
    });
    expect(result).toEqual({
      videoId: 'video-1',
      unpublished: true,
    });
  });

  it('updates metadata using current user id', async () => {
    updateVideoMetadataUseCase.execute.mockResolvedValue({
      ...buildMetadata(),
      title: 'Updated Video',
    });

    const result = await controller.updateMetadata('owner-1', 'video-1', {
      title: 'Updated Video',
      visibility: VideoVisibility.PRIVATE,
    });

    expect(updateVideoMetadataUseCase.execute).toHaveBeenCalledWith({
      userId: 'owner-1',
      videoId: 'video-1',
      title: 'Updated Video',
      description: undefined,
      thumbnailUrl: undefined,
      categoryId: undefined,
      tagIds: undefined,
      visibility: VideoVisibility.PRIVATE,
    });
    expect(result).toMatchObject({
      id: 'video-1',
      title: 'Updated Video',
    });
  });

  it('keeps latest discovery routed through latest use case', async () => {
    getLatestVideosUseCase.execute.mockResolvedValue([]);

    await controller.latest('20');

    expect(getLatestVideosUseCase.execute).toHaveBeenCalledWith({
      limit: 20,
    });
  });

  it('returns paginated category discovery results', async () => {
    getVideosByCategoryUseCase.execute.mockResolvedValue({
      items: [
        {
          id: 'video-1',
          channelId: 'channel-1',
          title: 'Video',
          description: 'Description',
          category: 'music',
          tags: ['action'],
          status: VideoStatus.READY,
          price: 0,
          requiredTierLevel: null,
          thumbnailUrl: null,
          durationSeconds: 120,
          resolutions: ['720p'],
          errorMessage: null,
          viewCount: 10,
          publishedAt: new Date('2026-01-01T00:00:00.000Z'),
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        },
      ],
      pagination: {
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      },
    });

    const result = await controller.byCategory('music', '2', '10');

    expect(getVideosByCategoryUseCase.execute).toHaveBeenCalledWith({
      category: 'music',
      page: 2,
      limit: 10,
    });
    expect(result).toEqual({
      success: true,
      code: 200,
      data: [
        {
          id: 'video-1',
          channelId: 'channel-1',
          title: 'Video',
          description: 'Description',
          category: 'music',
          tags: ['action'],
          status: VideoStatus.READY,
          price: 0,
          requiredTierLevel: null,
          thumbnailUrl: null,
          durationSeconds: 120,
          resolutions: ['720p'],
          errorMessage: null,
          viewCount: 10,
          publishedAt: '2026-01-01T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      mess: undefined,
      pagination: {
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      },
    });
  });

  it('returns paginated purchased videos for the current user', async () => {
    getPurchasedVideosUseCase.execute.mockResolvedValue({
      items: [
        {
          videoId: 'video-1',
          channelId: 'channel-1',
          channelName: 'Cinema Labs',
          title: 'Premium Video',
          description: 'Description',
          thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
          durationSeconds: 120,
          categories: ['music'],
          tags: ['action'],
          priceCoin: 500,
          purchasedAt: new Date('2026-01-03T00:00:00.000Z'),
          publishedAt: new Date('2026-01-01T00:00:00.000Z'),
          viewCount: 10,
          accessStatus: 'ACTIVE',
        },
      ],
      pagination: {
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      },
    });

    const result = await controller.purchased('viewer-1', '2', '10');

    expect(getPurchasedVideosUseCase.execute).toHaveBeenCalledWith({
      userId: 'viewer-1',
      page: 2,
      limit: 10,
    });
    expect(result).toEqual({
      success: true,
      code: 200,
      data: [
        {
          videoId: 'video-1',
          channelId: 'channel-1',
          channelName: 'Cinema Labs',
          title: 'Premium Video',
          description: 'Description',
          thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
          durationSeconds: 120,
          categories: ['music'],
          tags: ['action'],
          priceCoin: 500,
          purchasedAt: '2026-01-03T00:00:00.000Z',
          publishedAt: '2026-01-01T00:00:00.000Z',
          viewCount: 10,
          accessStatus: 'ACTIVE',
        },
      ],
      mess: undefined,
      pagination: {
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      },
    });
  });

  it('returns subscribed discovery videos for the current user', async () => {
    getSubscribedVideosUseCase.execute.mockResolvedValue([
      {
        id: 'video-1',
        channelId: 'channel-1',
        title: 'Member Feed Video',
        description: 'Description',
        category: 'music',
        tags: ['action'],
        status: VideoStatus.READY,
        price: 0,
        requiredTierLevel: null,
        thumbnailUrl: null,
        durationSeconds: 120,
        resolutions: ['720p'],
        errorMessage: null,
        viewCount: 10,
        publishedAt: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);

    const result = await controller.subscribed('viewer-1', '999');

    expect(getSubscribedVideosUseCase.execute).toHaveBeenCalledWith({
      userId: 'viewer-1',
      limit: 50,
    });
    expect(result).toEqual([
      {
        id: 'video-1',
        channelId: 'channel-1',
        title: 'Member Feed Video',
        description: 'Description',
        category: 'music',
        tags: ['action'],
        status: VideoStatus.READY,
        price: 0,
        requiredTierLevel: null,
        thumbnailUrl: null,
        durationSeconds: 120,
        resolutions: ['720p'],
        errorMessage: null,
        viewCount: 10,
        publishedAt: '2026-01-01T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    ]);
  });

  it('uses default page and clamps limit for purchased videos', async () => {
    getPurchasedVideosUseCase.execute.mockResolvedValue({
      items: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
      },
    });

    await controller.purchased('viewer-1', undefined, '999');

    expect(getPurchasedVideosUseCase.execute).toHaveBeenCalledWith({
      userId: 'viewer-1',
      page: 1,
      limit: 50,
    });
  });

  it('returns studio videos for the current owner with filters', async () => {
    getStudioVideosUseCase.execute.mockResolvedValue([
      {
        id: 'video-1',
        channelId: 'channel-1',
        title: 'Draft Video',
        description: 'Description',
        category: 'music',
        tags: ['action'],
        status: VideoStatus.DRAFT,
        visibility: VideoVisibility.PRIVATE,
        price: 100,
        requiredTierLevel: 2,
        thumbnailUrl: null,
        thumbnailSource: 'auto',
        thumbnailStatus: 'pending',
        durationSeconds: null,
        resolutions: [],
        errorMessage: null,
        jobStatus: 'waiting',
        jobStatusMessage: 'Upload initialized',
        failureReason: null,
        moderationDetails: null,
        viewCount: 0,
        publishedAt: null,
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        deleteReason: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);

    const result = await controller.studioVideos(
      'owner-1',
      '10',
      'draft,processing',
      'private',
    );

    expect(getStudioVideosUseCase.execute).toHaveBeenCalledWith({
      userId: 'owner-1',
      limit: 10,
      statuses: [VideoStatus.DRAFT, VideoStatus.PROCESSING],
      visibilities: [VideoVisibility.PRIVATE],
    });
    expect(result).toEqual([
      {
        id: 'video-1',
        channelId: 'channel-1',
        title: 'Draft Video',
        description: 'Description',
        category: 'music',
        tags: ['action'],
        status: VideoStatus.DRAFT,
        visibility: VideoVisibility.PRIVATE,
        price: 100,
        requiredTierLevel: 2,
        thumbnailUrl: null,
        thumbnailSource: 'auto',
        thumbnailStatus: 'pending',
        durationSeconds: null,
        resolutions: [],
        errorMessage: null,
        jobStatus: 'waiting',
        jobStatusMessage: 'Upload initialized',
        failureReason: null,
        moderationDetails: null,
        viewCount: 0,
        publishedAt: null,
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        deleteReason: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    ]);
  });

  it('returns studio video detail for a draft owned by current user', async () => {
    getStudioVideoDetailUseCase.execute.mockResolvedValue({
      id: 'video-1',
      channelId: 'channel-1',
      title: 'Draft Video',
      description: 'Description',
      category: 'music',
      tags: ['action'],
      status: VideoStatus.DRAFT,
      visibility: VideoVisibility.PRIVATE,
      price: 100,
      requiredTierLevel: null,
      thumbnailUrl: null,
      thumbnailSource: 'auto',
      thumbnailStatus: 'pending',
      durationSeconds: null,
      resolutions: [],
      errorMessage: null,
      jobStatus: 'waiting',
      jobStatusMessage: 'Upload initialized',
      failureReason: null,
      moderationDetails: null,
      viewCount: 0,
      publishedAt: null,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      deleteReason: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    const result = await controller.studioVideoDetail('owner-1', 'video-1');

    expect(getStudioVideoDetailUseCase.execute).toHaveBeenCalledWith({
      userId: 'owner-1',
      videoId: 'video-1',
    });
    expect(result).toMatchObject({
      id: 'video-1',
      status: VideoStatus.DRAFT,
      jobStatus: 'waiting',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    });
  });

  it('streams owner thumbnail with private cache headers', async () => {
    const stream = Readable.from(['thumbnail']);
    const response = { setHeader: jest.fn() };
    getVideoThumbnailUseCase.execute.mockResolvedValue({
      stream,
      contentType: 'image/jpeg',
      cacheControl: 'private, max-age=300',
    });

    const result = await controller.ownerThumbnail(
      'owner-1',
      'video-1',
      response as never,
    );

    expect(getVideoThumbnailUseCase.execute).toHaveBeenCalledWith({
      userId: 'owner-1',
      videoId: 'video-1',
      mode: 'owner',
    });
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'image/jpeg',
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'private, max-age=300',
    );
    expect(result).toBeDefined();
  });

  it('streams public thumbnail with public cache headers', async () => {
    const stream = Readable.from(['thumbnail']);
    const response = { setHeader: jest.fn() };
    getVideoThumbnailUseCase.execute.mockResolvedValue({
      stream,
      contentType: 'image/webp',
      cacheControl: 'public, max-age=3600',
    });

    const result = await controller.publicThumbnail(
      'video-1',
      response as never,
    );

    expect(getVideoThumbnailUseCase.execute).toHaveBeenCalledWith({
      videoId: 'video-1',
      mode: 'public',
    });
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'image/webp',
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=3600',
    );
    expect(result).toBeDefined();
  });

  it('maps continue watching rows to DTO shape', async () => {
    getContinueWatchingUseCase.execute.mockResolvedValue([
      {
        videoId: 'video-1',
        channelId: 'channel-1',
        title: 'Video',
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        durationSeconds: 120,
        resumePositionSeconds: 45,
        remainingSeconds: 75,
        lastWatchedAt: new Date('2026-01-03T00:00:00.000Z'),
        viewCount: 10,
      },
    ]);

    const result = await controller.continueWatching('viewer-1', '20');

    expect(getContinueWatchingUseCase.execute).toHaveBeenCalledWith({
      userId: 'viewer-1',
      limit: 20,
    });
    expect(result).toEqual([
      {
        videoId: 'video-1',
        channelId: 'channel-1',
        title: 'Video',
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        durationSeconds: 120,
        resumePositionSeconds: 45,
        remainingSeconds: 75,
        lastWatchedAt: '2026-01-03T00:00:00.000Z',
        viewCount: 10,
      },
    ]);
  });
});

function buildMetadata(): {
  id: string;
  channelId: string;
  channelName: string;
  avatarUrlChannel: string;
  membershipTiers: Array<{
    id: string;
    channelId: string;
    name: string;
    level: number;
    priceCoin: number;
    isAcceptingNew: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
  title: string;
  description: string;
  categoryId: string;
  category: string;
  tagIds: string[];
  tags: string[];
  thumbnailUrl: string;
  viewCount: number;
  price: number;
  requiredTierLevel: number | null;
  status: VideoStatus;
  visibility: VideoVisibility;
  errorMessage: string | null;
  jobStatus: string;
  jobStatusMessage: string;
  failureReason: string | null;
  moderationDetails: null;
  publishedAt: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: string | null;
  deleteReason: string | null;
  updatedAt: Date;
} {
  return {
    id: 'video-1',
    channelId: 'channel-1',
    channelName: 'Cinema Labs',
    avatarUrlChannel: 'https://cdn.example.com/channel-avatar.jpg',
    membershipTiers: [
      {
        id: 'tier-1',
        channelId: 'channel-1',
        name: 'Supporter',
        level: 1,
        priceCoin: 100,
        isAcceptingNew: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ],
    title: 'Video',
    description: 'Description',
    categoryId: 'category-1',
    category: 'music',
    tagIds: ['tag-1'],
    tags: ['action'],
    thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
    viewCount: 10,
    price: 50,
    requiredTierLevel: 2,
    status: VideoStatus.READY,
    visibility: VideoVisibility.PUBLIC,
    errorMessage: null,
    jobStatus: 'succeeded',
    jobStatusMessage: 'Video processing completed',
    failureReason: null,
    moderationDetails: null,
    publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    deleteReason: null,
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };
}
