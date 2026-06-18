import {
  BadRequestException,
  ConflictException,
} from '@shared/domain/exceptions/domain.exception';

import {
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { PurchaseVideoUseCase } from './purchase-video.use-case';

describe('PurchaseVideoUseCase', () => {
  const videoRepository = {
    findById: jest.fn(),
  };
  const unlockRepository = {
    exists: jest.fn(),
  };
  const financePaymentClient = {
    charge: jest.fn(),
  };
  const unlockVideoUseCase = {
    execute: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    videoRepository.findById.mockResolvedValue(buildVideo());
    unlockRepository.exists.mockResolvedValue(false);
    financePaymentClient.charge.mockResolvedValue({
      transactions: [{ id: 'tx-1' }],
    });
  });

  it('charges authoritative video price and unlocks after finance success', async () => {
    const useCase = new PurchaseVideoUseCase(
      videoRepository as never,
      unlockRepository as never,
      financePaymentClient as never,
      unlockVideoUseCase as never,
    );

    const result = await useCase.execute({
      userId: 'viewer-1',
      videoId: 'video-1',
      traceId: 'trace-1',
    });

    expect(financePaymentClient.charge).toHaveBeenCalledWith({
      payerUserId: 'viewer-1',
      idempotencyKey: 'video-purchase:viewer-1:video-1',
      traceId: 'trace-1',
      serviceType: 'video',
      serviceId: 'video-1',
      channelId: 'channel-1',
      channelOwnerId: 'creator-1',
      coinAmount: 100,
      metadata: {
        videoTitle: 'Premium Video',
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
      },
    });
    expect(unlockVideoUseCase.execute).toHaveBeenCalledWith({
      userId: 'viewer-1',
      videoId: 'video-1',
    });
    expect(result).toEqual({
      videoId: 'video-1',
      channelId: 'channel-1',
      priceCoin: 100,
      unlocked: true,
      paymentTransactionId: 'tx-1',
    });
  });

  it('returns existing unlock without charging finance', async () => {
    unlockRepository.exists.mockResolvedValue(true);
    const useCase = new PurchaseVideoUseCase(
      videoRepository as never,
      unlockRepository as never,
      financePaymentClient as never,
      unlockVideoUseCase as never,
    );

    const result = await useCase.execute({
      userId: 'viewer-1',
      videoId: 'video-1',
    });

    expect(financePaymentClient.charge).not.toHaveBeenCalled();
    expect(unlockVideoUseCase.execute).not.toHaveBeenCalled();
    expect(result.paymentTransactionId).toBeNull();
  });

  it('returns existing unlock for a private video without charging finance', async () => {
    videoRepository.findById.mockResolvedValue(
      buildVideo({ visibility: VideoVisibility.PRIVATE }),
    );
    unlockRepository.exists.mockResolvedValue(true);
    const useCase = new PurchaseVideoUseCase(
      videoRepository as never,
      unlockRepository as never,
      financePaymentClient as never,
      unlockVideoUseCase as never,
    );

    const result = await useCase.execute({
      userId: 'viewer-1',
      videoId: 'video-1',
    });

    expect(financePaymentClient.charge).not.toHaveBeenCalled();
    expect(unlockVideoUseCase.execute).not.toHaveBeenCalled();
    expect(result).toEqual({
      videoId: 'video-1',
      channelId: 'channel-1',
      priceCoin: 100,
      unlocked: true,
      paymentTransactionId: null,
    });
  });

  it('rejects private videos for new purchases', async () => {
    videoRepository.findById.mockResolvedValue(
      buildVideo({ visibility: VideoVisibility.PRIVATE }),
    );
    const useCase = new PurchaseVideoUseCase(
      videoRepository as never,
      unlockRepository as never,
      financePaymentClient as never,
      unlockVideoUseCase as never,
    );

    await expect(
      useCase.execute({ userId: 'viewer-1', videoId: 'video-1' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(financePaymentClient.charge).not.toHaveBeenCalled();
    expect(unlockVideoUseCase.execute).not.toHaveBeenCalled();
  });

  it('rejects unavailable videos before charging finance', async () => {
    videoRepository.findById.mockResolvedValue(
      buildVideo({ status: VideoStatus.DRAFT }),
    );
    const useCase = new PurchaseVideoUseCase(
      videoRepository as never,
      unlockRepository as never,
      financePaymentClient as never,
      unlockVideoUseCase as never,
    );

    await expect(
      useCase.execute({ userId: 'viewer-1', videoId: 'video-1' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(financePaymentClient.charge).not.toHaveBeenCalled();
  });

  it('rejects free videos before charging finance', async () => {
    videoRepository.findById.mockResolvedValue(buildVideo({ price: 0 }));
    const useCase = new PurchaseVideoUseCase(
      videoRepository as never,
      unlockRepository as never,
      financePaymentClient as never,
      unlockVideoUseCase as never,
    );

    await expect(
      useCase.execute({ userId: 'viewer-1', videoId: 'video-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(financePaymentClient.charge).not.toHaveBeenCalled();
  });
});

function buildVideo(
  overrides: Partial<{
    id: string;
    channelId: string;
    ownerId: string;
    title: string;
    status: VideoStatus;
    visibility: VideoVisibility;
    price: number;
    thumbnailUrl: string | null;
    isAvailableForPlayback: boolean;
  }> = {},
): {
  id: string;
  channelId: string;
  ownerId: string;
  title: string;
  status: VideoStatus;
  visibility: VideoVisibility;
  price: number;
  thumbnailUrl: string | null;
  isAvailableForPlayback: boolean;
} {
  return {
    id: 'video-1',
    channelId: 'channel-1',
    ownerId: 'creator-1',
    title: 'Premium Video',
    status: VideoStatus.READY,
    visibility: VideoVisibility.PUBLIC,
    price: 100,
    thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
    isAvailableForPlayback: true,
    ...overrides,
  };
}
