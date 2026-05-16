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
