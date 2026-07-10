import {
  VideoEntity,
  VideoStatus,
  VideoThumbnailSource,
  VideoThumbnailStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { Category } from '../../../categories/domain/entities/category.entity';
import { VideoProcessingDispatchTransactionService } from './video-processing-dispatch-transaction.service';
import { VideoOrmEntity } from './video.orm-entity';
import { VideoTagOrmEntity } from './video-tag.orm-entity';
import { VideoProcessingDispatchStatus } from './video-processing-dispatch.orm-entity';

describe('VideoProcessingDispatchTransactionService', () => {
  const manager = {
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    insert: jest.fn(),
    query: jest.fn(),
  };
  const dataSource = {
    transaction: jest.fn(),
  };

  let service: VideoProcessingDispatchTransactionService;

  beforeEach(() => {
    jest.clearAllMocks();
    dataSource.transaction.mockImplementation(async (callback) =>
      callback(manager),
    );
    manager.save.mockResolvedValue(undefined);
    manager.update.mockResolvedValue({ affected: 1 });
    manager.delete.mockResolvedValue(undefined);
    manager.insert.mockResolvedValue(undefined);
    manager.query.mockResolvedValue(undefined);
    service = new VideoProcessingDispatchTransactionService(
      dataSource as never,
    );
  });

  it('saves the video and inserts dispatch intent idempotently by job id', async () => {
    const video = buildProcessingVideo();

    await service.saveVideoWithProcessingDispatch(video, {
      jobId: 'transcode-video-1',
      payload: {
        videoId: 'video-1',
        rawFileKey: 'raw.mp4',
        resolution: ['720p'],
        userId: 'owner-1',
      },
    });

    expect(manager.save).toHaveBeenCalledWith(
      VideoOrmEntity,
      expect.objectContaining({
        id: 'video-1',
        status: VideoStatus.PROCESSING,
      }),
    );
    expect(manager.delete).toHaveBeenCalledWith(VideoTagOrmEntity, {
      videoId: 'video-1',
    });
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT ("job_id") DO NOTHING'),
      [
        expect.any(String),
        'video-1',
        'transcode-video-1',
        {
          videoId: 'video-1',
          rawFileKey: 'raw.mp4',
          resolution: ['720p'],
          userId: 'owner-1',
        },
        VideoProcessingDispatchStatus.PENDING,
        expect.any(Date),
      ],
    );
  });

  it('conditionally saves video and dispatch only when current status matches', async () => {
    const video = buildProcessingVideo();

    await expect(
      service.saveVideoWithProcessingDispatchIfStatus(
        video,
        {
          jobId: 'transcode-video-1',
          payload: {
            videoId: 'video-1',
            rawFileKey: 'raw.mp4',
            resolution: ['720p'],
            userId: 'owner-1',
          },
        },
        VideoStatus.PENDING_MANUAL_REVIEW,
      ),
    ).resolves.toBe(true);

    expect(manager.update).toHaveBeenCalledWith(
      VideoOrmEntity,
      { id: 'video-1', status: VideoStatus.PENDING_MANUAL_REVIEW },
      expect.objectContaining({ status: VideoStatus.PROCESSING }),
    );
    expect(manager.delete).toHaveBeenCalledWith(VideoTagOrmEntity, {
      videoId: 'video-1',
    });
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT ("job_id") DO NOTHING'),
      expect.arrayContaining(['video-1', 'transcode-video-1']),
    );
  });

  it('skips tag and dispatch writes when conditional status update misses', async () => {
    manager.update.mockResolvedValueOnce({ affected: 0 });
    const video = buildProcessingVideo();

    await expect(
      service.saveVideoWithProcessingDispatchIfStatus(
        video,
        {
          jobId: 'transcode-video-1',
          payload: {
            videoId: 'video-1',
            rawFileKey: 'raw.mp4',
            resolution: ['720p'],
            userId: 'owner-1',
          },
        },
        VideoStatus.PENDING_MANUAL_REVIEW,
      ),
    ).resolves.toBe(false);

    expect(manager.delete).not.toHaveBeenCalled();
    expect(manager.insert).not.toHaveBeenCalled();
    expect(manager.query).not.toHaveBeenCalled();
  });
});

function buildProcessingVideo(): VideoEntity {
  return new VideoEntity({
    id: 'video-1',
    channelId: 'channel-1',
    ownerId: 'owner-1',
    title: 'Video',
    description: 'Description',
    category: new Category({
      id: 'category-1',
      name: 'Music',
      slug: 'music',
      description: null,
      parentId: null,
      status: 'active' as never,
      sortOrder: 1,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    }),
    visibility: VideoVisibility.PUBLIC,
    status: VideoStatus.PROCESSING,
    price: 0,
    requiredTierLevel: null,
    rawFileKey: 'raw.mp4',
    masterPlaylistKey: null,
    thumbnailUrl: null,
    thumbnailObjectKey: null,
    thumbnailSource: VideoThumbnailSource.AUTO,
    thumbnailStatus: VideoThumbnailStatus.PROCESSING,
    thumbnailGeneratedAt: null,
    thumbnailError: null,
    durationSeconds: null,
    resolutions: ['720p'],
    errorMessage: null,
    viewCount: 0,
    publishedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    statusChangedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}
