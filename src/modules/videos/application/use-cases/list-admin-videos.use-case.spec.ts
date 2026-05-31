import {
  BadRequestException,
  ForbiddenException,
} from '@shared/domain/exceptions/domain.exception';
import {
  ChannelEntity,
  ChannelStatus,
} from '../../../channels/domain/entities/channel.entity';
import type { IChannelRepository } from '../../../channels/domain/repositories/channel.repository';
import { Category } from '../../../categories/domain/entities/category.entity';
import { CategoryStatus } from '../../../categories/domain/entities/category.entity';
import {
  VideoEntity,
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import type { IVideoRepository } from '../../domain/repositories/video.repository';
import { ListAdminVideosUseCase } from './list-admin-videos.use-case';

describe('ListAdminVideosUseCase', () => {
  it('lists admin videos with filters and pagination', async () => {
    const video = buildVideo();
    const findAdminVideos = jest.fn().mockResolvedValue({
      items: [video],
      total: 1,
    });
    const findByIds = jest.fn().mockResolvedValue([buildChannel()]);
    const useCase = new ListAdminVideosUseCase(
      createVideoRepository({ findAdminVideos }),
      createChannelRepository({ findByIds }),
    );

    const result = await useCase.execute({
      adminId: 'admin-1',
      role: 'admin',
      status: VideoStatus.READY,
      visibility: VideoVisibility.PUBLIC,
      channelId: 'channel-1',
      ownerId: 'owner-1',
      q: ' Video ',
      page: 2,
      limit: 10,
    });

    expect(findAdminVideos).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      status: VideoStatus.READY,
      visibility: VideoVisibility.PUBLIC,
      channelId: 'channel-1',
      ownerId: 'owner-1',
      q: 'Video',
    });
    expect(findByIds).toHaveBeenCalledWith(['channel-1']);
    expect(result).toEqual({
      items: [
        expect.objectContaining({
          id: 'video-1',
          channelId: 'channel-1',
          channelName: 'Channel',
          ownerId: 'owner-1',
          title: 'Video',
          status: VideoStatus.READY,
          visibility: VideoVisibility.PUBLIC,
        }),
      ],
      pagination: {
        page: 2,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });
  });

  it('uses default pagination and clamps limit', async () => {
    const findAdminVideos = jest.fn().mockResolvedValue({
      items: [],
      total: 0,
    });
    const useCase = new ListAdminVideosUseCase(
      createVideoRepository({ findAdminVideos }),
      createChannelRepository(),
    );

    await useCase.execute({
      adminId: 'admin-1',
      role: 'admin',
      page: -1,
      limit: 1000,
    });

    expect(findAdminVideos).toHaveBeenCalledWith({
      page: 1,
      limit: 100,
      status: undefined,
      visibility: undefined,
      channelId: undefined,
      ownerId: undefined,
      q: undefined,
    });
  });

  it('rejects non-admin callers', async () => {
    const useCase = new ListAdminVideosUseCase(
      createVideoRepository(),
      createChannelRepository(),
    );

    await expect(
      useCase.execute({ adminId: 'user-1', role: 'user' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects invalid status and visibility filters', async () => {
    const useCase = new ListAdminVideosUseCase(
      createVideoRepository(),
      createChannelRepository(),
    );

    await expect(
      useCase.execute({
        adminId: 'admin-1',
        role: 'admin',
        status: 'published',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      useCase.execute({
        adminId: 'admin-1',
        role: 'admin',
        visibility: 'members_only',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

function createVideoRepository(input?: {
  findAdminVideos?: jest.Mock;
}): IVideoRepository {
  return {
    findAdminVideos:
      input?.findAdminVideos ??
      jest.fn().mockResolvedValue({
        items: [],
        total: 0,
      }),
  } as unknown as IVideoRepository;
}

function createChannelRepository(input?: {
  findByIds?: jest.Mock;
}): IChannelRepository {
  return {
    findByIds: input?.findByIds ?? jest.fn().mockResolvedValue([]),
  } as unknown as IChannelRepository;
}

function buildChannel(): ChannelEntity {
  return new ChannelEntity({
    id: 'channel-1',
    userId: 'owner-1',
    name: 'Channel',
    bio: 'Bio',
    avatarUrl: '',
    bannerUrl: '',
    status: ChannelStatus.ACTIVE,
    isEligibleForMembership: false,
    isMembershipClosedByAdmin: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

function buildVideo(): VideoEntity {
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
      status: CategoryStatus.ACTIVE,
      displayOrder: 0,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    }),
    tags: [],
    visibility: VideoVisibility.PUBLIC,
    status: VideoStatus.READY,
    price: 0,
    requiredTierLevel: null,
    rawFileKey: 'raw.mp4',
    masterPlaylistKey: null,
    thumbnailUrl: null,
    durationSeconds: null,
    resolutions: [],
    errorMessage: null,
    moderationDetails: null,
    viewCount: 0,
    publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    statusChangedAt: new Date('2026-01-02T00:00:00.000Z'),
  });
}
