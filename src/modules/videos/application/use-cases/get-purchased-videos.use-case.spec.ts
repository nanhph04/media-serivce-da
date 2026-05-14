import type { IVideoPurchaseUnlockRepository } from '../../domain/repositories/video-purchase-unlock.repository';
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
          videoId: 'video-1',
          channelId: 'channel-1',
          channelName: 'Cinema Labs',
          title: 'Premium Video',
          description: 'Description',
          thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
          durationSeconds: 120,
          categories: ['music'],
          tags: ['action'],
          priceCoin: 500,
          purchasedAt: new Date('2026-01-03T00:00:00.000Z'),
          publishedAt: new Date('2026-01-01T00:00:00.000Z'),
          viewCount: 10,
          accessStatus: 'ACTIVE',
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

function buildVideo(): {
  videoId: string;
  channelId: string;
  channelName: string | null;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  categories: string[];
  tags: string[];
  priceCoin: number;
  purchasedAt: Date;
  publishedAt: Date | null;
  viewCount: number;
  accessStatus: 'ACTIVE';
} {
  return {
    videoId: 'video-1',
    channelId: 'channel-1',
    channelName: 'Cinema Labs',
    title: 'Premium Video',
    description: 'Description',
    thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
    durationSeconds: 120,
    categories: ['music'],
    tags: ['action'],
    priceCoin: 500,
    purchasedAt: new Date('2026-01-03T00:00:00.000Z'),
    publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    viewCount: 10,
    accessStatus: 'ACTIVE',
  };
}
