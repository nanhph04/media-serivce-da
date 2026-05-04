import { HandleVideoPaymentSuccessUseCase } from './handle-video-payment-success.use-case';

describe('HandleVideoPaymentSuccessUseCase', () => {
  const unlockVideoUseCase = {
    execute: jest.fn(),
  };
  const cacheService = {
    setIfNotExists: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('unlocks video when event is first seen', async () => {
    cacheService.setIfNotExists.mockResolvedValue(true);
    const useCase = new HandleVideoPaymentSuccessUseCase(
      unlockVideoUseCase as never,
      cacheService as never,
    );

    await useCase.execute({
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

    expect(unlockVideoUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      videoId: 'video-1',
    });
  });

  it('skips duplicate event ids', async () => {
    cacheService.setIfNotExists.mockResolvedValue(false);
    const useCase = new HandleVideoPaymentSuccessUseCase(
      unlockVideoUseCase as never,
      cacheService as never,
    );

    await useCase.execute({
      eventId: 'event-2',
      data: {
        userId: 'user-2',
        videoId: 'video-2',
        channelId: 'channel-2',
        channelOwnerId: 'owner-2',
        coinAmount: 150,
        paymentTransactionId: 'tx-2',
      },
    });

    expect(unlockVideoUseCase.execute).not.toHaveBeenCalled();
  });
});
