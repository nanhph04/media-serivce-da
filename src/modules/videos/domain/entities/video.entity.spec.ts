import {
  Category,
  CategoryStatus,
} from '../../../categories/domain/entities/category.entity';
import { VideoEntity, VideoStatus, VideoVisibility } from './video.entity';

describe('VideoEntity', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('sets statusChangedAt when creating a video', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    jest.useFakeTimers().setSystemTime(now);

    const video = VideoEntity.create({
      channelId: 'channel-1',
      ownerId: 'owner-1',
      title: 'Video',
      description: 'Description',
      category: buildCategory(),
      tags: [],
      visibility: VideoVisibility.PUBLIC,
      price: 0,
      requiredTierLevel: null,
      rawFileKey: 'raw/video.mp4',
    });

    expect(video.statusChangedAt).toEqual(now);
  });

  it('rejects a paid video price that is not divisible by 10', () => {
    expect(() =>
      VideoEntity.create({
        channelId: 'channel-1',
        ownerId: 'owner-1',
        title: 'Video',
        description: 'Description',
        category: buildCategory(),
        tags: [],
        visibility: VideoVisibility.PUBLIC,
        price: 15,
        requiredTierLevel: null,
        rawFileKey: 'raw/video.mp4',
      }),
    ).toThrow('Video price must be divisible by 10');
  });

  it('allows a paid video price that is divisible by 10', () => {
    const video = VideoEntity.create({
      channelId: 'channel-1',
      ownerId: 'owner-1',
      title: 'Video',
      description: 'Description',
      category: buildCategory(),
      tags: [],
      visibility: VideoVisibility.PUBLIC,
      price: 100,
      requiredTierLevel: null,
      rawFileKey: 'raw/video.mp4',
    });

    expect(video.price).toBe(100);
  });

  it('updates statusChangedAt when status changes', () => {
    const video = buildVideo({
      status: VideoStatus.PENDING_MODERATION,
      statusChangedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const now = new Date('2026-01-02T00:00:00.000Z');
    jest.useFakeTimers().setSystemTime(now);

    video.markProcessing();

    expect(video.status).toBe(VideoStatus.PROCESSING);
    expect(video.statusChangedAt).toEqual(now);
    expect(video.updatedAt).toEqual(now);
  });

  it('does not update statusChangedAt for metadata-only changes', () => {
    const statusChangedAt = new Date('2026-01-01T00:00:00.000Z');
    const now = new Date('2026-01-02T00:00:00.000Z');
    const video = buildVideo({
      status: VideoStatus.READY,
      statusChangedAt,
      masterPlaylistKey: 'processed/master.m3u8',
      durationSeconds: 120,
    });
    jest.useFakeTimers().setSystemTime(now);

    video.updateMetadata({ title: 'Updated Video' });

    expect(video.title).toBe('Updated Video');
    expect(video.statusChangedAt).toEqual(statusChangedAt);
    expect(video.updatedAt).toEqual(now);
  });

  it('falls back to updatedAt for older loaded videos without statusChangedAt', () => {
    const updatedAt = new Date('2026-01-01T00:00:00.000Z');
    const video = buildVideo({
      statusChangedAt: undefined,
      updatedAt,
    });

    expect(video.statusChangedAt).toEqual(updatedAt);
  });

  it('marks a processing video as ready with normalized playback details', () => {
    const video = buildVideo({ status: VideoStatus.PROCESSING });

    video.markReady({
      masterPlaylistKey: ' processed/master.m3u8 ',
      durationSeconds: 120,
      resolutions: [' 1080p ', '720p'],
    });

    expect(video.status).toBe(VideoStatus.READY);
    expect(video.masterPlaylistKey).toBe('processed/master.m3u8');
    expect(video.durationSeconds).toBe(120);
    expect(video.resolutions).toEqual(['1080p', '720p']);
  });

  it.each([
    VideoStatus.DRAFT,
    VideoStatus.PENDING_MODERATION,
    VideoStatus.PENDING_MANUAL_REVIEW,
    VideoStatus.REJECTED,
    VideoStatus.READY,
    VideoStatus.FAILED,
    VideoStatus.BANNED,
  ])('rejects marking a %s video as ready', (status) => {
    const video = buildVideo({ status });

    expect(() =>
      video.markReady({
        masterPlaylistKey: 'processed/master.m3u8',
        durationSeconds: 120,
        resolutions: ['1080p'],
      }),
    ).toThrow('Video must be processing before it can be marked ready');
  });

  it('rejects marking ready without a master playlist key', () => {
    const video = buildVideo({ status: VideoStatus.PROCESSING });

    expect(() =>
      video.markReady({
        masterPlaylistKey: '   ',
        durationSeconds: 120,
        resolutions: ['1080p'],
      }),
    ).toThrow('Video master playlist is required');
  });

  it.each([0, -1])(
    'rejects marking ready with invalid duration %s',
    (durationSeconds) => {
      const video = buildVideo({ status: VideoStatus.PROCESSING });

      expect(() =>
        video.markReady({
          masterPlaylistKey: 'processed/master.m3u8',
          durationSeconds,
          resolutions: ['1080p'],
        }),
      ).toThrow('Video duration must be greater than zero');
    },
  );

  it('rejects marking ready without processed resolutions', () => {
    const video = buildVideo({ status: VideoStatus.PROCESSING });

    expect(() =>
      video.markReady({
        masterPlaylistKey: 'processed/master.m3u8',
        durationSeconds: 120,
        resolutions: ['   '],
      }),
    ).toThrow('At least one video resolution is required');
  });

  it.each([VideoStatus.PENDING_MODERATION, VideoStatus.PROCESSING])(
    'marks a %s video as failed with a normalized reason',
    (status) => {
      const video = buildVideo({ status });

      video.markFailed(' Processing service unavailable ');

      expect(video.status).toBe(VideoStatus.FAILED);
      expect(video.errorMessage).toBe('Processing service unavailable');
    },
  );

  it.each([
    VideoStatus.DRAFT,
    VideoStatus.PENDING_MANUAL_REVIEW,
    VideoStatus.REJECTED,
    VideoStatus.READY,
    VideoStatus.FAILED,
    VideoStatus.BANNED,
  ])('rejects marking a %s video as failed', (status) => {
    const video = buildVideo({ status });

    expect(() => video.markFailed('Processing failed')).toThrow(
      'Video cannot be marked as failed from its current status',
    );
  });

  it('rejects marking failed without a reason', () => {
    const video = buildVideo({ status: VideoStatus.PROCESSING });

    expect(() => video.markFailed('   ')).toThrow(
      'Video failure reason is required',
    );
  });
});

function buildVideo(
  overrides: Partial<ConstructorParameters<typeof VideoEntity>[0]> = {},
): VideoEntity {
  return new VideoEntity({
    id: 'video-1',
    channelId: 'channel-1',
    ownerId: 'owner-1',
    title: 'Video',
    description: 'Description',
    category: buildCategory(),
    tags: [],
    visibility: VideoVisibility.PUBLIC,
    status: VideoStatus.DRAFT,
    price: 0,
    requiredTierLevel: null,
    rawFileKey: 'raw/video.mp4',
    masterPlaylistKey: null,
    thumbnailUrl: null,
    durationSeconds: null,
    resolutions: [],
    errorMessage: null,
    viewCount: 0,
    publishedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    statusChangedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}

function buildCategory(): Category {
  return new Category({
    id: 'category-1',
    name: 'Music',
    slug: 'music',
    description: null,
    status: CategoryStatus.ACTIVE,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  });
}
