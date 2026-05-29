import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  VideoEntity,
  VideoDeletionStatus,
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { UnpublishVideoUseCase } from './unpublish-video.use-case';

describe('UnpublishVideoUseCase', () => {
  const videoRepository = {
    findById: jest.fn(),
    save: jest.fn(),
  };
  const videoOutboxTransaction = {
    saveVideoWithOutbox: jest.fn(),
  };
  const useCase = new UnpublishVideoUseCase(
    videoRepository as never,
    videoOutboxTransaction as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    videoRepository.save.mockResolvedValue(undefined);
    videoOutboxTransaction.saveVideoWithOutbox.mockResolvedValue(undefined);
  });

  it('marks a ready video pending delete and publishes delete request', async () => {
    videoRepository.findById.mockResolvedValue(buildVideo());

    const result = await useCase.execute({
      userId: 'owner-1',
      videoId: 'video-1',
    });

    const [savedVideo, outboxMessage] = videoOutboxTransaction
      .saveVideoWithOutbox.mock.calls[0] as [
      VideoEntity,
      { topic: string; messageKey: string; payload: { data: unknown } },
    ];
    expect(savedVideo.isDeleted).toBe(true);
    expect(savedVideo.deletionStatus).toBe(VideoDeletionStatus.PENDING_DELETE);
    expect(savedVideo.deletedAt).toBeInstanceOf(Date);
    expect(savedVideo.deletedBy).toBe('owner-1');
    expect(savedVideo.deleteReason).toBe('creator_delete');
    expect(outboxMessage).toMatchObject({
      topic: 'video.delete.requested',
      messageKey: 'video-1',
      payload: {
        eventType: 'video.delete.requested',
        aggregateId: 'video-1',
        sourceService: 'media-service',
        data: {
          videoId: 'video-1',
          channelId: 'channel-1',
          ownerId: 'owner-1',
          deletedBy: 'owner-1',
          deletedAt: expect.any(String),
          refundWindowHours: 72,
        },
      },
    });
    expect(result).toEqual({
      videoId: 'video-1',
      unpublished: true,
    });
  });

  it('throws not found when video does not exist', async () => {
    videoRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'owner-1', videoId: 'missing' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws forbidden when user does not own the video', async () => {
    videoRepository.findById.mockResolvedValue(
      buildVideo({ ownerId: 'owner-2' }),
    );

    await expect(
      useCase.execute({ userId: 'owner-1', videoId: 'video-1' }),
    ).rejects.toThrow(ForbiddenException);
    expect(videoOutboxTransaction.saveVideoWithOutbox).not.toHaveBeenCalled();
  });

  it.each([
    VideoStatus.DRAFT,
    VideoStatus.PENDING_MODERATION,
    VideoStatus.PROCESSING,
    VideoStatus.PENDING_MANUAL_REVIEW,
    VideoStatus.REJECTED,
    VideoStatus.FAILED,
    VideoStatus.BANNED,
  ])('throws conflict when video status is %s', async (status) => {
    videoRepository.findById.mockResolvedValue(buildVideo({ status }));

    await expect(
      useCase.execute({ userId: 'owner-1', videoId: 'video-1' }),
    ).rejects.toThrow(ConflictException);
    expect(videoOutboxTransaction.saveVideoWithOutbox).not.toHaveBeenCalled();
  });
});

function buildVideo(
  overrides: Partial<{
    ownerId: string;
    status: VideoStatus;
  }> = {},
): VideoEntity {
  return new VideoEntity({
    id: 'video-1',
    channelId: 'channel-1',
    ownerId: overrides.ownerId ?? 'owner-1',
    title: 'Video',
    description: 'Description',
    category: [],
    tags: [],
    visibility: VideoVisibility.PUBLIC,
    status: overrides.status ?? VideoStatus.READY,
    price: 0,
    requiredTierLevel: null,
    rawFileKey: 'uploads/raw/channel-1/video.mp4',
    masterPlaylistKey: 'processed/channel-1/video/master.m3u8',
    thumbnailUrl: null,
    durationSeconds: 120,
    resolutions: ['720p'],
    errorMessage: null,
    viewCount: 0,
    publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}
