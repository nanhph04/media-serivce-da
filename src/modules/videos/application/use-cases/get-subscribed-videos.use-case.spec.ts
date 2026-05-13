import {
  Category,
  CategoryStatus,
} from '../../../categories/domain/entities/category.entity';
import {
  VideoEntity,
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { Tag, TagStatus } from '../../../tags/domain/entities/tag.entity';
import { GetSubscribedVideosUseCase } from './get-subscribed-videos.use-case';

describe('GetSubscribedVideosUseCase', () => {
  const videoRepository = {
    findByChannelIds: jest.fn(),
  };
  const channelAccessService = {
    getActiveMembershipChannelIds: jest.fn(),
  };

  const useCase = new GetSubscribedVideosUseCase(
    videoRepository as never,
    channelAccessService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an empty list when the user has no active membership channels', async () => {
    channelAccessService.getActiveMembershipChannelIds.mockResolvedValue([]);
    videoRepository.findByChannelIds.mockResolvedValue([]);

    await expect(
      useCase.execute({
        userId: 'user-1',
        limit: 20,
      }),
    ).resolves.toEqual([]);

    expect(
      channelAccessService.getActiveMembershipChannelIds,
    ).toHaveBeenCalledWith('user-1');
    expect(videoRepository.findByChannelIds).toHaveBeenCalledWith([], 20);
  });

  it('loads recent videos from active membership-backed channels only', async () => {
    channelAccessService.getActiveMembershipChannelIds.mockResolvedValue([
      'channel-1',
      'channel-2',
    ]);
    videoRepository.findByChannelIds.mockResolvedValue([
      buildVideoEntity({ id: 'video-1', channelId: 'channel-1' }),
      buildVideoEntity({ id: 'video-2', channelId: 'channel-2' }),
    ]);

    await expect(
      useCase.execute({
        userId: 'user-1',
        limit: 10,
      }),
    ).resolves.toEqual([
      buildVideoListItem({ id: 'video-1', channelId: 'channel-1' }),
      buildVideoListItem({ id: 'video-2', channelId: 'channel-2' }),
    ]);

    expect(
      channelAccessService.getActiveMembershipChannelIds,
    ).toHaveBeenCalledWith('user-1');
    expect(videoRepository.findByChannelIds).toHaveBeenCalledWith(
      ['channel-1', 'channel-2'],
      10,
    );
  });
});

function buildVideoListItem(
  overrides: Partial<{
    id: string;
    channelId: string;
  }> = {},
): {
  id: string;
  channelId: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  status: string;
  price: number;
  requiredTierLevel: number | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  resolutions: string[];
  errorMessage: string | null;
  viewCount: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
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
    ...overrides,
  };
}

function buildVideoEntity(
  overrides: Partial<ConstructorParameters<typeof VideoEntity>[0]> = {},
): VideoEntity {
  return new VideoEntity({
    id: 'video-1',
    channelId: 'channel-1',
    ownerId: 'owner-1',
    title: 'Video',
    description: 'Description',
    category: buildCategory(),
    tags: [buildTag()],
    visibility: VideoVisibility.PUBLIC,
    status: VideoStatus.READY,
    price: 0,
    requiredTierLevel: null,
    rawFileKey: 'uploads/raw/channel-1/video.mp4',
    masterPlaylistKey: 'processed/channel-1/video/master.m3u8',
    thumbnailUrl: null,
    durationSeconds: 120,
    resolutions: ['720p'],
    errorMessage: null,
    viewCount: 10,
    publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  });
}

function buildTag(): Tag {
  return new Tag({
    id: 'tag-1',
    name: 'Action',
    slug: 'action',
    status: TagStatus.ACTIVE,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
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
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}
