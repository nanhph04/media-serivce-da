import {
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import type { IVideoPurchaseUnlockRepository } from '../../domain/repositories/video-purchase-unlock.repository';
import { Category } from '../../../categories/domain/entities/category.entity';
import { CategoryStatus } from '../../../categories/domain/entities/category.entity';
import { VideoEntity } from '../../domain/entities/video.entity';
import { GetPurchasedVideosUseCase } from './get-purchased-videos.use-case';

describe('GetPurchasedVideosUseCase', () => {
  const unlockRepository: jest.Mocked<IVideoPurchaseUnlockRepository> = {
    save: jest.fn(),
    exists: jest.fn(),
    findPurchasedByUserId: jest.fn(),
  };
  const useCase = new GetPurchasedVideosUseCase(unlockRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns paged purchased videos for the user', async () => {
    unlockRepository.findPurchasedByUserId.mockResolvedValue({
      items: [buildVideo()],
      total: 21,
    });

    const result = await useCase.execute({
      userId: 'viewer-1',
      page: 2,
      limit: 10,
    });

    expect(unlockRepository.findPurchasedByUserId).toHaveBeenCalledWith({
      userId: 'viewer-1',
      page: 2,
      limit: 10,
    });
    expect(result).toEqual({
      items: [
        {
          id: 'video-1',
          channelId: 'channel-1',
          title: 'Premium Video',
          description: 'Description',
          categories: ['music'],
          status: VideoStatus.READY,
          price: 500,
          requiredTierLevel: null,
          thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
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
        total: 21,
        totalPages: 3,
      },
    });
  });
});

function buildVideo(): VideoEntity {
  return new VideoEntity({
    id: 'video-1',
    channelId: 'channel-1',
    ownerId: 'owner-1',
    title: 'Premium Video',
    description: 'Description',
    category: [
      new Category({
        id: 'category-1',
        name: 'Music',
        slug: 'music',
        description: null,
        status: CategoryStatus.ACTIVE,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      }),
    ],
    visibility: VideoVisibility.PRIVATE,
    status: VideoStatus.READY,
    price: 500,
    requiredTierLevel: null,
    rawFileKey: 'raw/video.mp4',
    masterPlaylistKey: 'processed/master.m3u8',
    thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
    durationSeconds: 120,
    resolutions: ['720p'],
    errorMessage: null,
    viewCount: 10,
    publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  });
}
