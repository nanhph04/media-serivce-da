import { BadRequestException } from '@shared/domain/exceptions/domain.exception';
import { SearchContentUseCase } from './search-content.use-case';

describe('SearchContentUseCase', () => {
  const videoSearchQueryService = {
    searchPublicVideos: jest.fn(),
  };
  const channelSearchQueryService = {
    searchChannels: jest.fn(),
  };

  const useCase = new SearchContentUseCase(
    videoSearchQueryService as never,
    channelSearchQueryService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects when q and category are both missing', async () => {
    await expect(useCase.execute({ page: 1, limit: 20 })).rejects.toThrow(
      BadRequestException,
    );
    expect(videoSearchQueryService.searchPublicVideos).not.toHaveBeenCalled();
    expect(channelSearchQueryService.searchChannels).not.toHaveBeenCalled();
  });

  it('returns videos and channels for keyword search', async () => {
    videoSearchQueryService.searchPublicVideos.mockResolvedValue({
      items: [{ id: 'v1' }],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    channelSearchQueryService.searchChannels.mockResolvedValue([{ id: 'c1' }]);

    await expect(
      useCase.execute({
        q: 'music',
        page: 1,
        limit: 10,
      }),
    ).resolves.toEqual({
      videos: [{ id: 'v1' }],
      channels: [{ id: 'c1' }],
      query: {
        q: 'music',
        category: null,
        page: 1,
        limit: 10,
      },
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    expect(videoSearchQueryService.searchPublicVideos).toHaveBeenCalledWith({
      q: 'music',
      category: undefined,
      page: 1,
      limit: 10,
    });
    expect(channelSearchQueryService.searchChannels).toHaveBeenCalledWith({
      q: 'music',
      limit: 10,
    });
  });

  it('returns only videos for category-only search', async () => {
    videoSearchQueryService.searchPublicVideos.mockResolvedValue({
      items: [{ id: 'v1' }],
      pagination: { page: 2, limit: 12, total: 1, totalPages: 1 },
    });

    await expect(
      useCase.execute({
        category: 'music',
        page: 2,
        limit: 12,
      }),
    ).resolves.toEqual({
      videos: [{ id: 'v1' }],
      channels: [],
      query: {
        q: null,
        category: 'music',
        page: 2,
        limit: 12,
      },
      pagination: { page: 2, limit: 12, total: 1, totalPages: 1 },
    });
    expect(channelSearchQueryService.searchChannels).not.toHaveBeenCalled();
  });

  it('trims q and category before searching', async () => {
    videoSearchQueryService.searchPublicVideos.mockResolvedValue({
      items: [],
      pagination: { page: 1, limit: 5, total: 0, totalPages: 0 },
    });
    channelSearchQueryService.searchChannels.mockResolvedValue([]);

    await useCase.execute({
      q: '  piano  ',
      category: '  acoustic  ',
      page: 1,
      limit: 5,
    });

    expect(videoSearchQueryService.searchPublicVideos).toHaveBeenCalledWith({
      q: 'piano',
      category: 'acoustic',
      page: 1,
      limit: 5,
    });
    expect(channelSearchQueryService.searchChannels).toHaveBeenCalledWith({
      q: 'piano',
      limit: 5,
    });
  });
});
