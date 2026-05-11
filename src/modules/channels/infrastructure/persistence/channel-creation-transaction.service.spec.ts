import { OutboxMessageStatus } from '@shared/infrastructure/messaging/outbox-message.orm-entity';
import {
  ChannelEntity,
  ChannelStatus,
} from '../../domain/entities/channel.entity';
import { ChannelOrmEntity } from './channel.orm-entity';
import { ChannelCreationTransactionService } from './channel-creation-transaction.service';

describe('ChannelCreationTransactionService', () => {
  const channelSave = jest.fn();
  const outboxSave = jest.fn();
  const manager = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === ChannelOrmEntity) {
        return { save: channelSave };
      }

      return { save: outboxSave };
    }),
  };
  const dataSource = {
    transaction: jest.fn(
      async (callback: (transactionManager: typeof manager) => Promise<void>) =>
        callback(manager),
    ),
  };

  const service = new ChannelCreationTransactionService(dataSource as never);

  beforeEach(() => {
    jest.clearAllMocks();
    channelSave.mockResolvedValue(undefined);
    outboxSave.mockResolvedValue(undefined);
  });

  it('persists channel and outbox message in one transaction callback', async () => {
    await service.createChannelWithOutbox(buildChannel(), {
      topic: 'channel.created',
      messageKey: 'user-1',
      payload: buildEvent(),
    });

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(channelSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'channel-1',
        userId: 'user-1',
        name: 'Creator Channel',
      }),
    );
    expect(outboxSave).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'channel.created',
        messageKey: 'user-1',
        payload: buildEvent(),
        status: OutboxMessageStatus.PENDING,
        attemptCount: 0,
        lockedAt: null,
        publishedAt: null,
        lastError: null,
      }),
    );
  });

  it('rejects the transaction when outbox persistence fails', async () => {
    outboxSave.mockRejectedValueOnce(new Error('outbox insert failed'));

    await expect(
      service.createChannelWithOutbox(buildChannel(), {
        topic: 'channel.created',
        messageKey: 'user-1',
        payload: buildEvent(),
      }),
    ).rejects.toThrow('outbox insert failed');
  });
});

function buildChannel(): ChannelEntity {
  return new ChannelEntity({
    id: 'channel-1',
    userId: 'user-1',
    name: 'Creator Channel',
    bio: 'Channel bio',
    avatarUrl: '',
    bannerUrl: '',
    status: ChannelStatus.ACTIVE,
    isEligibleForMembership: false,
    isMembershipClosedByAdmin: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

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
