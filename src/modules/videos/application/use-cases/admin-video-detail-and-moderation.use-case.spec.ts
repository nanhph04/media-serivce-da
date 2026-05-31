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
import {
  ChannelEntity,
  ChannelStatus,
} from '../../../channels/domain/entities/channel.entity';
import type { IChannelRepository } from '../../../channels/domain/repositories/channel.repository';
import { Tag, TagStatus } from '../../../tags/domain/entities/tag.entity';
import {
  VideoEntity,
  VideoStatus,
  VideoThumbnailSource,
  VideoThumbnailStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import type { IVideoRepository } from '../../domain/repositories/video.repository';
import type { IVideoPurchaseUnlockRepository } from '../../domain/repositories/video-purchase-unlock.repository';
import { GetAdminVideoDetailUseCase } from './get-admin-video-detail.use-case';
import { ModerateAdminVideoUseCase } from './moderate-admin-video.use-case';

const cacheInvalidator = {
  invalidateMetadata: jest.fn(),
  invalidateDiscoveryLists: jest.fn(),
};
const videoProcessingJobDispatcher = {
  enqueueTranscodeJob: jest.fn(),
};
const objectStorageService = {
  getBucketName: jest.fn(),
};
const moderationOutcomePublisher = {
  publishModerationOutcome: jest.fn(),
};
const videoStatusEventPublisher = {
  publishVideoStatusChanged: jest.fn(),
};

describe('Admin video detail and moderation use cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cacheInvalidator.invalidateMetadata.mockResolvedValue(undefined);
    cacheInvalidator.invalidateDiscoveryLists.mockResolvedValue(undefined);
    videoProcessingJobDispatcher.enqueueTranscodeJob.mockResolvedValue(
      undefined,
    );
    objectStorageService.getBucketName.mockReturnValue('media-public');
    moderationOutcomePublisher.publishModerationOutcome.mockResolvedValue(
      undefined,
    );
  });

  it('rejects admin video detail for non-admin callers', async () => {
    const useCase = createGetAdminVideoDetailUseCase();

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
    const useCase = createGetAdminVideoDetailUseCase({ video });

    await expect(
      useCase.execute({
        adminId: 'admin-1',
        role: 'admin',
        videoId: 'video-1',
      }),
    ).resolves.toMatchObject({
      id: 'video-1',
      channelName: 'Channel',
      ownerId: 'owner-1',
      categoryTitle: 'Music',
      purchaseCount: 3,
      status: VideoStatus.REJECTED,
    });
  });

  it('rejects admin video detail when video does not exist', async () => {
    const useCase = createGetAdminVideoDetailUseCase();

    await expect(
      useCase.execute({
        adminId: 'admin-1',
        role: 'admin',
        videoId: 'missing-video',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('approves pending manual review video by queueing processing', async () => {
    const video = buildVideo(VideoStatus.PENDING_MANUAL_REVIEW);
    const save = jest.fn().mockResolvedValue(undefined);
    const useCase = createModerateAdminVideoUseCase({ video, save });

    const result = await useCase.execute({
      adminId: 'admin-1',
      role: 'admin',
      videoId: 'video-1',
      action: 'approve',
    });

    expect(result.status).toBe(VideoStatus.PROCESSING);
    expect(result.errorMessage).toBeNull();
    expect(result.publishedAt).toBeNull();
    expect(result.moderationDetails).toEqual({
      reason: 'Needs review',
      confidence: 0.8,
      evidenceTimestampSeconds: null,
    });
    expect(save).toHaveBeenCalledWith(video);
    expect(
      videoProcessingJobDispatcher.enqueueTranscodeJob,
    ).toHaveBeenCalledWith({
      videoId: 'video-1',
      rawFileKey: 'raw.mp4',
      resolution: ['720p'],
      userId: 'owner-1',
      thumbnailTargetObjectKey: 'videos/video-1/thumbnails/default.jpg',
      thumbnailTargetBucket: 'media-public',
    });
    expect(
      videoStatusEventPublisher.publishVideoStatusChanged,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        videoId: 'video-1',
        userId: 'owner-1',
        status: VideoStatus.PROCESSING,
        jobStatus: 'processing',
        moderationDetails: {
          reason: 'Needs review',
          confidence: 0.8,
          evidenceTimestampSeconds: null,
        },
      }),
    );
    expect(
      moderationOutcomePublisher.publishModerationOutcome,
    ).toHaveBeenCalledWith({
      videoId: 'video-1',
      moderationStatus: 'PENDING_MANUAL_REVIEW',
      videoStatus: VideoStatus.PROCESSING,
      outcome: 'QUEUED_FOR_PROCESSING',
      reason: 'Needs review',
      confidence: 0.8,
      evidenceTimestampSeconds: null,
      transcodeQueued: true,
    });
    expect(cacheInvalidator.invalidateMetadata).toHaveBeenCalledWith('video-1');
    expect(cacheInvalidator.invalidateDiscoveryLists).toHaveBeenCalled();
  });

  it('approves custom-thumbnail manual review video without auto thumbnail target', async () => {
    const video = buildVideo(VideoStatus.PENDING_MANUAL_REVIEW, {
      thumbnailSource: VideoThumbnailSource.CUSTOM,
    });
    const useCase = createModerateAdminVideoUseCase({ video });

    await useCase.execute({
      adminId: 'admin-1',
      role: 'admin',
      videoId: 'video-1',
      action: 'approve',
    });

    expect(
      videoProcessingJobDispatcher.enqueueTranscodeJob,
    ).toHaveBeenCalledWith({
      videoId: 'video-1',
      rawFileKey: 'raw.mp4',
      resolution: ['720p'],
      userId: 'owner-1',
      thumbnailTargetObjectKey: undefined,
      thumbnailTargetBucket: undefined,
    });
  });

  it('rejects pending manual review video with reason', async () => {
    const video = buildVideo(VideoStatus.PENDING_MANUAL_REVIEW);
    const useCase = createModerateAdminVideoUseCase({ video });

    const result = await useCase.execute({
      adminId: 'admin-1',
      role: 'admin',
      videoId: 'video-1',
      action: 'reject',
      reason: 'Policy issue',
    });

    expect(result.status).toBe(VideoStatus.REJECTED);
    expect(result.errorMessage).toBe('Policy issue');
    expect(
      videoProcessingJobDispatcher.enqueueTranscodeJob,
    ).not.toHaveBeenCalled();
    expect(
      videoStatusEventPublisher.publishVideoStatusChanged,
    ).not.toHaveBeenCalled();
    expect(
      moderationOutcomePublisher.publishModerationOutcome,
    ).not.toHaveBeenCalled();
  });

  it('rejects moderation without rejection reason', async () => {
    const useCase = createModerateAdminVideoUseCase({
      video: buildVideo(VideoStatus.PENDING_MANUAL_REVIEW),
    });

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
    const useCase = createModerateAdminVideoUseCase({
      video: buildVideo(VideoStatus.READY),
    });

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

function createChannelRepository(input?: {
  channel?: ChannelEntity | null;
}): IChannelRepository {
  return {
    findById: jest.fn().mockResolvedValue(input?.channel ?? buildChannel()),
  } as unknown as IChannelRepository;
}

function createUnlockRepository(input?: {
  purchaseCount?: number;
}): IVideoPurchaseUnlockRepository {
  return {
    countByVideoId: jest.fn().mockResolvedValue(input?.purchaseCount ?? 3),
  } as unknown as IVideoPurchaseUnlockRepository;
}

function createGetAdminVideoDetailUseCase(input?: {
  video?: VideoEntity;
  channel?: ChannelEntity | null;
  purchaseCount?: number;
}): GetAdminVideoDetailUseCase {
  return new GetAdminVideoDetailUseCase(
    createVideoRepository({ video: input?.video }),
    createChannelRepository({ channel: input?.channel }),
    createUnlockRepository({ purchaseCount: input?.purchaseCount }),
  );
}

function createModerateAdminVideoUseCase(input?: {
  video?: VideoEntity;
  save?: jest.Mock;
}): ModerateAdminVideoUseCase {
  return new ModerateAdminVideoUseCase(
    createVideoRepository(input),
    cacheInvalidator,
    videoProcessingJobDispatcher,
    objectStorageService as never,
    moderationOutcomePublisher,
    videoStatusEventPublisher,
  );
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

function buildVideo(
  status: VideoStatus,
  input: { thumbnailSource?: VideoThumbnailSource } = {},
): VideoEntity {
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
    thumbnailObjectKey: null,
    thumbnailUrl: null,
    thumbnailSource: input.thumbnailSource ?? VideoThumbnailSource.AUTO,
    thumbnailStatus: VideoThumbnailStatus.PROCESSING,
    thumbnailGeneratedAt: null,
    thumbnailError: null,
    durationSeconds: null,
    resolutions: ['720p'],
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
