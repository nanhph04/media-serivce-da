import { HandleVideoViewedUseCase } from './handle-video-viewed.use-case';

describe('HandleVideoViewedUseCase', () => {
  const videoViewAggregation = {
    recordViewedEvent: jest.fn(),
  };

  const useCase = new HandleVideoViewedUseCase(videoViewAggregation as never);

  beforeEach(() => {
    jest.clearAllMocks();
    videoViewAggregation.recordViewedEvent.mockResolvedValue(true);
  });

  it('records a viewed event into the aggregation store', async () => {
    await useCase.execute({
      eventId: 'event-1',
      data: {
        videoId: 'video-1',
        userId: 'user-1',
      },
    });

    expect(videoViewAggregation.recordViewedEvent).toHaveBeenCalledWith(
      'event-1',
      'video-1',
    );
  });

  it('still delegates duplicate events to the aggregation store idempotently', async () => {
    videoViewAggregation.recordViewedEvent.mockResolvedValue(false);

    await useCase.execute({
      eventId: 'event-1',
      data: {
        videoId: 'video-1',
        userId: 'user-1',
      },
    });

    expect(videoViewAggregation.recordViewedEvent).toHaveBeenCalledWith(
      'event-1',
      'video-1',
    );
  });
});
