import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  Category,
  CategoryStatus,
} from '../../../categories/domain/entities/category.entity';
import { Tag, TagStatus } from '../../../tags/domain/entities/tag.entity';
import {
  VideoEntity,
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import type { IVideoRepository } from '../../domain/repositories/video.repository';
import { GetAdminVideoDetailUseCase } from './get-admin-video-detail.use-case';
import { ModerateAdminVideoUseCase } from './moderate-admin-video.use-case';

describe('Admin video detail and moderation use cases', () => {
  const cacheInvalidator = {
    invalidateMetadata: jest.fn(),
    invalidateDiscoveryLists: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    cacheInvalidator.invalidateMetadata.mockResolvedValue(undefined);
    cacheInvalidator.invalidateDiscoveryLists.mockResolvedValue(undefined);
  });

  it('rejects admin video detail for non-admin callers', async () => {
    const useCase = new GetAdminVideoDetailUseCase(createVideoRepository());

    await expect(
      useCase.execute({
        adminId: 'user-1',
        role: 'creator',
        videoId: 'video-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns admin video detail including owner id', async () => {
    const video = buildVideo(VideoStatus.REJECTED);
    const useCase = new GetAdminVideoDetailUseCase(
      createVideoRepository({ video }),
    );

    await expect(
      useCase.execute({
        adminId: 'admin-1',
        role: 'admin',
        videoId: 'video-1',
      }),
    ).resolves.toMatchObject({
      id: 'video-1',
      ownerId: 'owner-1',
      status: VideoStatus.REJECTED,
    });
  });

  it('rejects admin video detail when video does not exist', async () => {
    const useCase = new GetAdminVideoDetailUseCase(createVideoRepository());

    await expect(
      useCase.execute({
        adminId: 'admin-1',
        role: 'admin',
        videoId: 'missing-video',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('approves pending manual review video', async () => {
    const video = buildVideo(VideoStatus.PENDING_MANUAL_REVIEW);
    const save = jest.fn().mockResolvedValue(undefined);
    const useCase = new ModerateAdminVideoUseCase(
      createVideoRepository({ video, save }),
      cacheInvalidator,
    );

    const result = await useCase.execute({
      adminId: 'admin-1',
      role: 'admin',
      videoId: 'video-1',
      action: 'approve',
    });

    expect(result.status).toBe(VideoStatus.READY);
    expect(save).toHaveBeenCalledWith(video);
    expect(cacheInvalidator.invalidateMetadata).toHaveBeenCalledWith('video-1');
    expect(cacheInvalidator.invalidateDiscoveryLists).toHaveBeenCalled();
  });

  it('rejects pending manual review video with reason', async () => {
    const video = buildVideo(VideoStatus.PENDING_MANUAL_REVIEW);
    const useCase = new ModerateAdminVideoUseCase(
      createVideoRepository({ video }),
      cacheInvalidator,
    );

    const result = await useCase.execute({
      adminId: 'admin-1',
      role: 'admin',
      videoId: 'video-1',
      action: 'reject',
      reason: 'Policy issue',
    });

    expect(result.status).toBe(VideoStatus.REJECTED);
    expect(result.errorMessage).toBe('Policy issue');
  });

  it('rejects moderation without rejection reason', async () => {
    const useCase = new ModerateAdminVideoUseCase(
      createVideoRepository({
        video: buildVideo(VideoStatus.PENDING_MANUAL_REVIEW),
      }),
      cacheInvalidator,
    );

    await expect(
      useCase.execute({
        adminId: 'admin-1',
        role: 'admin',
        videoId: 'video-1',
        action: 'reject',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects moderation for videos outside manual review', async () => {
    const useCase = new ModerateAdminVideoUseCase(
      createVideoRepository({ video: buildVideo(VideoStatus.READY) }),
      cacheInvalidator,
    );

    await expect(
      useCase.execute({
        adminId: 'admin-1',
        role: 'admin',
        videoId: 'video-1',
        action: 'approve',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

function createVideoRepository(input?: {
  video?: VideoEntity;
  save?: jest.Mock;
}): IVideoRepository {
  return {
    findAdminVideoById: jest.fn().mockResolvedValue(input?.video ?? null),
    save: input?.save ?? jest.fn().mockResolvedValue(undefined),
  } as unknown as IVideoRepository;
}

function buildVideo(status: VideoStatus): VideoEntity {
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
    tags: [
      new Tag({
        id: 'tag-1',
        name: 'Action',
        slug: 'action',
        status: TagStatus.ACTIVE,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    ],
    visibility: VideoVisibility.PUBLIC,
    status,
    price: 0,
    requiredTierLevel: null,
    rawFileKey: 'raw.mp4',
    masterPlaylistKey: null,
    thumbnailUrl: null,
    durationSeconds: null,
    resolutions: [],
    errorMessage:
      status === VideoStatus.PENDING_MANUAL_REVIEW ? 'Needs review' : null,
    moderationDetails:
      status === VideoStatus.PENDING_MANUAL_REVIEW
        ? {
            reason: 'Needs review',
            confidence: 0.8,
            evidenceTimestampSeconds: null,
          }
        : null,
    viewCount: 0,
    publishedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    statusChangedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}
