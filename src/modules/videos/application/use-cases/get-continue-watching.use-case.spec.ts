import { GetContinueWatchingUseCase } from './get-continue-watching.use-case';

describe('GetContinueWatchingUseCase', () => {
  const videoQueryService = {
    getContinueWatching: jest.fn(),
  };

  const useCase = new GetContinueWatchingUseCase(videoQueryService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates continue watching query to video query service', async () => {
    videoQueryService.getContinueWatching.mockResolvedValue([]);

    await useCase.execute({
      userId: 'viewer-1',
      page: 1,
      limit: 20,
    });

    expect(videoQueryService.getContinueWatching).toHaveBeenCalledWith(
      'viewer-1',
      1,
      20,
    );
  });
});
