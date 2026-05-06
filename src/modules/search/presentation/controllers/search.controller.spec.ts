import { SearchController } from './search.controller';

describe('SearchController', () => {
  const searchContentUseCase = {
    execute: jest.fn(),
  };
  const controller = new SearchController(searchContentUseCase as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps GET /search?q=... results', async () => {
    searchContentUseCase.execute.mockResolvedValue({
      videos: [
        {
          id: 'video-1',
          channelId: 'channel-1',
          title: 'Piano lesson',
          description: 'Basics',
          categories: ['music'],
          status: 'ready',
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
        },
      ],
      channels: [
        {
          id: 'channel-1',
          userId: 'user-1',
          name: 'Piano Hub',
          bio: 'All about piano',
          avatarUrl: '',
          bannerUrl: '',
          status: 'active',
          isEligibleForMembership: false,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        },
      ],
      query: {
        q: 'piano',
        category: null,
        limit: 20,
      },
    });

    const result = await controller.search({
      q: 'piano',
      limit: 20,
    });

    expect(searchContentUseCase.execute).toHaveBeenCalledWith({
      q: 'piano',
      category: undefined,
      limit: 20,
    });
    expect(result).toEqual({
      videos: [
        {
          id: 'video-1',
          channelId: 'channel-1',
          title: 'Piano lesson',
          description: 'Basics',
          categories: ['music'],
          status: 'ready',
          price: 0,
          requiredTierLevel: null,
          thumbnailUrl: null,
          durationSeconds: 120,
          resolutions: ['720p'],
          errorMessage: null,
          viewCount: 10,
          publishedAt: '2026-01-01T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      channels: [
        {
          id: 'channel-1',
          userId: 'user-1',
          name: 'Piano Hub',
          bio: 'All about piano',
          avatarUrl: '',
          bannerUrl: '',
          status: 'active',
          isEligibleForMembership: false,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      query: {
        q: 'piano',
        category: null,
        limit: 20,
      },
    });
  });

  it('passes category-only search through', async () => {
    searchContentUseCase.execute.mockResolvedValue({
      videos: [],
      channels: [],
      query: {
        q: null,
        category: 'music',
        limit: 15,
      },
    });

    await controller.search({
      category: 'music',
      limit: 15,
    });

    expect(searchContentUseCase.execute).toHaveBeenCalledWith({
      q: undefined,
      category: 'music',
      limit: 15,
    });
  });
});
