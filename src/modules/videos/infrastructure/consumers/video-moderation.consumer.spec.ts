import { VideoModerationConsumer } from './video-moderation.consumer';

describe('VideoModerationConsumer', () => {
  const configService = {
    get: jest.fn(),
  };
  const kafkaService = {
    on: jest.fn(),
  };
  const handleVideoModerationCompletedUseCase = {
    execute: jest.fn(),
  };

  let consumer: VideoModerationConsumer;

  beforeEach(() => {
    jest.clearAllMocks();
    consumer = new VideoModerationConsumer(
      configService as never,
      kafkaService as never,
      handleVideoModerationCompletedUseCase as never,
    );
  });

  it('registers moderation completed topic handler and forwards payload', async () => {
    let handler:
      | ((payload: {
          value: {
            eventId: string;
            data: {
              videoId: string;
              status: 'SAFE';
              isSafe: boolean;
              reason: string;
              confidence: number;
              evidenceTimestampSeconds: number | null;
              rawFileKey: string;
              resolutions: string[];
              userId: string;
            };
          };
        }) => Promise<void>)
      | undefined;

    configService.get.mockReturnValue('video.moderation.completed');
    kafkaService.on.mockImplementation(
      async (_topic: string, callback: typeof handler): Promise<void> => {
        handler = callback;
      },
    );

    await consumer.onModuleInit();

    expect(kafkaService.on).toHaveBeenCalledWith(
      'video.moderation.completed',
      expect.any(Function),
    );

    await handler?.({
      value: {
        eventId: 'event-1',
        data: {
          videoId: 'video-1',
          status: 'SAFE',
          isSafe: true,
          reason: 'safe',
          confidence: 0.1,
          evidenceTimestampSeconds: null,
          rawFileKey: 'uploads/raw/channel-1/video.mp4',
          resolutions: ['720p'],
          userId: 'owner-1',
        },
      },
    });

    expect(handleVideoModerationCompletedUseCase.execute).toHaveBeenCalledWith({
      eventId: 'event-1',
      data: {
        videoId: 'video-1',
        status: 'SAFE',
        isSafe: true,
        reason: 'safe',
        confidence: 0.1,
        evidenceTimestampSeconds: null,
        rawFileKey: 'uploads/raw/channel-1/video.mp4',
        resolutions: ['720p'],
        userId: 'owner-1',
      },
    });
  });
});
