import { OutboxPublisherWorker } from './outbox-publisher.worker';
import { OutboxMessageStatus } from './outbox-message.orm-entity';

describe('OutboxPublisherWorker', () => {
  const dataSource = {
    query: jest.fn(),
  };
  const eventPublisher = {
    emit: jest.fn(),
  };
  const configService = {
    get: jest.fn(),
    getNumber: jest.fn(),
  };
  const logger = {
    setContext: jest.fn(),
    logError: jest.fn(),
  };

  const worker = new OutboxPublisherWorker(
    dataSource as never,
    eventPublisher as never,
    configService as never,
    logger as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    configService.get.mockImplementation((key: string) =>
      key === 'KAFKA_ENABLE' ? 'true' : undefined,
    );
    configService.getNumber.mockImplementation(
      (_key: string, defaultValue: number) => defaultValue,
    );
    eventPublisher.emit.mockResolvedValue(undefined);
  });

  it('publishes one pending outbox message and marks it published', async () => {
    const event = buildEvent();
    dataSource.query
      .mockResolvedValueOnce([
        {
          id: 'outbox-1',
          topic: 'channel.created',
          messageKey: 'user-1',
          payload: event,
          attemptCount: 0,
        },
      ])
      .mockResolvedValueOnce([]);

    const publishedCount = await worker.publishPendingBatch();

    expect(publishedCount).toBe(1);
    expect(eventPublisher.emit).toHaveBeenCalledWith('channel.created', [
      {
        key: 'user-1',
        value: event,
      },
    ]);
    expect(dataSource.query.mock.calls[1][1]).toEqual([
      OutboxMessageStatus.PUBLISHED,
      'outbox-1',
    ]);
    expect(dataSource.query.mock.calls[0][0]).toContain('WITH claimed AS');
  });

  it('returns failed publish to pending with retry metadata', async () => {
    const event = buildEvent();
    dataSource.query
      .mockResolvedValueOnce([
        {
          id: 'outbox-1',
          topic: 'channel.created',
          messageKey: 'user-1',
          payload: event,
          attemptCount: 2,
        },
      ])
      .mockResolvedValueOnce([]);
    eventPublisher.emit.mockRejectedValueOnce(new Error('kafka down'));

    const publishedCount = await worker.publishPendingBatch();

    expect(publishedCount).toBe(1);
    expect(eventPublisher.emit.mock.calls[0][1][0].value).toBe(event);
    expect(dataSource.query.mock.calls[1][1]).toEqual([
      OutboxMessageStatus.PENDING,
      expect.any(Date),
      'kafka down',
      'outbox-1',
    ]);
    expect(dataSource.query.mock.calls[1][1][1].toString()).not.toBe(
      'Invalid Date',
    );
  });

  it('uses the minimum retry backoff when attempt count is malformed', async () => {
    const event = buildEvent();
    dataSource.query
      .mockResolvedValueOnce([
        {
          id: 'outbox-1',
          topic: 'channel.created',
          messageKey: 'user-1',
          payload: event,
          attemptCount: Number.NaN,
        },
      ])
      .mockResolvedValueOnce([]);
    eventPublisher.emit.mockRejectedValueOnce(new Error('kafka down'));

    await worker.publishPendingBatch();

    expect(dataSource.query.mock.calls[1][1]).toEqual([
      OutboxMessageStatus.PENDING,
      expect.any(Date),
      'kafka down',
      'outbox-1',
    ]);
    expect(dataSource.query.mock.calls[1][1][1].toString()).not.toBe(
      'Invalid Date',
    );
  });

  it('does not claim messages when kafka is disabled', async () => {
    configService.get.mockReturnValue('false');

    const publishedCount = await worker.publishPendingBatch();

    expect(publishedCount).toBe(0);
    expect(dataSource.query).not.toHaveBeenCalled();
    expect(eventPublisher.emit).not.toHaveBeenCalled();
  });
});

function buildEvent(): object {
  return {
    eventId: 'event-1',
    eventType: 'channel.created',
    aggregateId: 'user-1',
    timestamp: '2026-01-01T00:00:00.000Z',
    version: 1,
    traceId: 'trace-1',
    sourceService: 'media-service',
    data: {
      channelId: 'channel-1',
      userId: 'user-1',
      title: 'Creator Channel',
    },
  };
}
