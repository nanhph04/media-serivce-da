import { RecordVideoViewUseCase } from './record-video-view.use-case';

describe('RecordVideoViewUseCase', () => {
  const idempotencyStore = {
    setIfNotExists: jest.fn(),
    delete: jest.fn(),
  };
  const eventPublisher = {
    emit: jest.fn(),
  };
  const videoViewConfig = {
    getVideoViewDedupeTtlSeconds: jest.fn(),
    getVideoViewTopic: jest.fn(),
  };

  let useCase: RecordVideoViewUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    idempotencyStore.setIfNotExists.mockResolvedValue(true);
    idempotencyStore.delete.mockResolvedValue(undefined);
    eventPublisher.emit.mockResolvedValue(undefined);
    videoViewConfig.getVideoViewDedupeTtlSeconds.mockReturnValue(1800);
    videoViewConfig.getVideoViewTopic.mockReturnValue('video.viewed');
    useCase = new RecordVideoViewUseCase(
      idempotencyStore as never,
      eventPublisher as never,
      videoViewConfig as never,
    );
  });

  it('publishes a video viewed event when dedupe key is created', async () => {
    await useCase.execute({ userId: 'user-1', videoId: 'video-1' });

    expect(idempotencyStore.setIfNotExists).toHaveBeenCalledWith(
      'media:view:user-1:video-1',
      '1',
      1800,
    );
    expect(eventPublisher.emit).toHaveBeenCalledWith('video.viewed', [
      {
        key: 'video-1',
        value: expect.objectContaining({
          eventType: 'video.viewed',
          aggregateId: 'video-1',
          version: 1,
          sourceService: 'media-service',
          data: {
            videoId: 'video-1',
            userId: 'user-1',
          },
        }),
      },
    ]);
    expect(idempotencyStore.delete).not.toHaveBeenCalled();
  });

  it('skips publishing when dedupe key already exists', async () => {
    idempotencyStore.setIfNotExists.mockResolvedValue(false);

    await useCase.execute({ userId: 'user-1', videoId: 'video-1' });

    expect(eventPublisher.emit).not.toHaveBeenCalled();
    expect(idempotencyStore.delete).not.toHaveBeenCalled();
  });

  it('releases dedupe key and rethrows when publishing fails', async () => {
    const publishError = new Error('Kafka down');
    eventPublisher.emit.mockRejectedValue(publishError);

    await expect(
      useCase.execute({ userId: 'user-1', videoId: 'video-1' }),
    ).rejects.toThrow(publishError);

    expect(idempotencyStore.delete).toHaveBeenCalledWith(
      'media:view:user-1:video-1',
    );
  });

  it('preserves publish error when releasing dedupe key also fails', async () => {
    const publishError = new Error('Kafka down');
    eventPublisher.emit.mockRejectedValue(publishError);
    idempotencyStore.delete.mockRejectedValue(new Error('Redis down'));

    await expect(
      useCase.execute({ userId: 'user-1', videoId: 'video-1' }),
    ).rejects.toThrow(publishError);

    expect(idempotencyStore.delete).toHaveBeenCalledWith(
      'media:view:user-1:video-1',
    );
  });
});
