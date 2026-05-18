import {
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
  VideoThumbnailSource,
  VideoThumbnailStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { GetStudioVideoDetailUseCase } from './get-studio-video-detail.use-case';

describe('GetStudioVideoDetailUseCase', () => {
  const videoRepository = {
    findById: jest.fn(),
  };
  const useCase = new GetStudioVideoDetailUseCase(videoRepository as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns draft video detail for the owner', async () => {
    videoRepository.findById.mockResolvedValue(buildVideo());

    const result = await useCase.execute({
      userId: 'owner-1',
      videoId: 'video-1',
    });

    expect(videoRepository.findById).toHaveBeenCalledWith('video-1');
    expect(result).toMatchObject({
      id: 'video-1',
      status: VideoStatus.DRAFT,
      jobStatus: 'waiting',
      jobStatusMessage: 'Upload initialized',
    });
  });

  it('throws not found when video does not exist', async () => {
    videoRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'owner-1', videoId: 'missing' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws forbidden when video belongs to another owner', async () => {
    videoRepository.findById.mockResolvedValue(
      buildVideo({ ownerId: 'owner-2' }),
    );

    await expect(
      useCase.execute({ userId: 'owner-1', videoId: 'video-1' }),
    ).rejects.toThrow(ForbiddenException);
  });
});

function buildVideo(overrides: { ownerId?: string } = {}): VideoEntity {
  const now = new Date('2026-01-01T00:00:00.000Z');

  return new VideoEntity({
    id: 'video-1',
    channelId: 'channel-1',
    ownerId: overrides.ownerId ?? 'owner-1',
    title: 'Draft Video',
    description: 'Description',
    category: new Category({
      id: 'category-1',
      name: 'Music',
      slug: 'music',
      description: null,
      parentId: null,
      status: CategoryStatus.ACTIVE,
      displayOrder: 1,
      createdAt: now,
      updatedAt: now,
    }),
    tags: [
      new Tag({
        id: 'tag-1',
        name: 'Action',
        slug: 'action',
        status: TagStatus.ACTIVE,
        createdAt: now,
        updatedAt: now,
      }),
    ],
    visibility: VideoVisibility.PRIVATE,
    status: VideoStatus.DRAFT,
    price: 0,
    requiredTierLevel: null,
    rawFileKey: 'uploads/raw/channel-1/video.mp4',
    masterPlaylistKey: null,
    thumbnailObjectKey: null,
    thumbnailUrl: null,
    thumbnailSource: VideoThumbnailSource.AUTO,
    thumbnailStatus: VideoThumbnailStatus.PENDING,
    thumbnailGeneratedAt: null,
    thumbnailError: null,
    durationSeconds: null,
    resolutions: [],
    errorMessage: null,
    viewCount: 0,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
    statusChangedAt: now,
  });
}
