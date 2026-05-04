import { VideoPaymentConsumer } from './video-payment.consumer';

describe('VideoPaymentConsumer', () => {
  const configService = {
    get: jest.fn(),
  };
  const kafkaService = {
    on: jest.fn(),
  };
  const handleVideoPaymentSuccessUseCase = {
    execute: jest.fn(),
  };

  let consumer: VideoPaymentConsumer;

  beforeEach(() => {
    jest.clearAllMocks();
    consumer = new VideoPaymentConsumer(
      configService as never,
      kafkaService as never,
      handleVideoPaymentSuccessUseCase as never,
    );
  });

  it('registers topic handler and forwards payload to use case', async () => {
    let handler:
      | ((payload: {
          value: {
            eventId: string;
            data: {
              userId: string;
              videoId: string;
              channelId: string;
              channelOwnerId: string;
              coinAmount: number;
              paymentTransactionId: string;
            };
          };
        }) => Promise<void>)
      | undefined;

    configService.get.mockReturnValue('video.payment.success');
    kafkaService.on.mockImplementation(
      async (_topic: string, callback: typeof handler): Promise<void> => {
        handler = callback;
      },
    );

    await consumer.onModuleInit();

    expect(kafkaService.on).toHaveBeenCalledWith(
      'video.payment.success',
      expect.any(Function),
    );

    await handler?.({
      value: {
        eventId: 'event-1',
        data: {
          userId: 'user-1',
          videoId: 'video-1',
          channelId: 'channel-1',
          channelOwnerId: 'owner-1',
          coinAmount: 100,
          paymentTransactionId: 'tx-1',
        },
      },
    });

    expect(handleVideoPaymentSuccessUseCase.execute).toHaveBeenCalledWith({
      eventId: 'event-1',
      data: {
        userId: 'user-1',
        videoId: 'video-1',
        channelId: 'channel-1',
        channelOwnerId: 'owner-1',
        coinAmount: 100,
        paymentTransactionId: 'tx-1',
      },
    });
  });
});
