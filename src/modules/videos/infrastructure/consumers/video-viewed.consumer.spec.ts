import { VideoViewedConsumer } from './video-viewed.consumer';

describe('VideoViewedConsumer', () => {
  const configService = {
    get: jest.fn(),
  };
  const kafkaService = {
    on: jest.fn(),
  };
  const handleVideoViewedUseCase = {
    execute: jest.fn(),
  };

  let consumer: VideoViewedConsumer;

  beforeEach(() => {
    jest.clearAllMocks();
    consumer = new VideoViewedConsumer(
      configService as never,
      kafkaService as never,
      handleVideoViewedUseCase as never,
    );
  });

  it('registers video viewed topic handler and forwards payload', async () => {
    let handler:
      | ((payload: {
          value: {
            eventId: string;
            timestamp: string;
            data: {
              videoId: string;
              userId: string;
            };
          };
        }) => Promise<void>)
      | undefined;

    configService.get.mockReturnValue('video.viewed');
    kafkaService.on.mockImplementation(
      async (_topic: string, callback: typeof handler): Promise<void> => {
        handler = callback;
      },
    );

    await consumer.onModuleInit();

    expect(kafkaService.on).toHaveBeenCalledWith(
      'video.viewed',
      expect.any(Function),
    );

    await handler?.({
      value: {
        eventId: 'event-1',
        timestamp: '2026-01-01T00:00:00.000Z',
        data: {
          videoId: 'video-1',
          userId: 'user-1',
        },
      },
    });

    expect(handleVideoViewedUseCase.execute).toHaveBeenCalledWith({
      eventId: 'event-1',
      timestamp: '2026-01-01T00:00:00.000Z',
      data: {
        videoId: 'video-1',
        userId: 'user-1',
      },
    });
  });
});
