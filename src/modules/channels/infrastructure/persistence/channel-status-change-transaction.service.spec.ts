import { OutboxMessageStatus } from '@shared/infrastructure/messaging/outbox-message.orm-entity';
import {
  ChannelMembershipRenewalStatus,
  ChannelMembershipStatus,
} from '../../domain/entities/channel-membership.entity';
import {
  ChannelEntity,
  ChannelStatus,
} from '../../domain/entities/channel.entity';
import { ChannelMembershipOrmEntity } from './channel-membership.orm-entity';
import { ChannelOrmEntity } from './channel.orm-entity';
import { ChannelStatusChangeTransactionService } from './channel-status-change-transaction.service';

describe('ChannelStatusChangeTransactionService', () => {
  const channelSave = jest.fn();
  const membershipUpdate = jest.fn();
  const outboxSave = jest.fn();
  const manager = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === ChannelOrmEntity) {
        return { save: channelSave };
      }
      if (entity === ChannelMembershipOrmEntity) {
        return { update: membershipUpdate };
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
  const configService = {
    get: jest.fn((_key: string, defaultValue: string) => defaultValue),
  };

  const service = new ChannelStatusChangeTransactionService(
    dataSource as never,
    configService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    channelSave.mockResolvedValue(undefined);
    membershipUpdate.mockResolvedValue({ affected: 1 });
    outboxSave.mockResolvedValue(undefined);
    configService.get.mockImplementation(
      (_key: string, defaultValue: string) => defaultValue,
    );
  });

  it('persists channel and outbox message in one transaction callback', async () => {
    await service.persistStatusChange({
      channel: buildChannel(ChannelStatus.SUSPENDED),
      disableAutoRenewByChannelId: true,
      statusChangedOutboxMessage: {
        messageKey: 'channel-1',
        payload: buildEvent(),
      },
    });

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(channelSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'channel-1',
        userId: 'owner-1',
        status: ChannelStatus.SUSPENDED,
      }),
    );
    expect(membershipUpdate).toHaveBeenCalledWith(
      {
        channelId: 'channel-1',
        status: ChannelMembershipStatus.ACTIVE,
        autoRenewEnabled: true,
      },
      expect.objectContaining({
        autoRenewEnabled: false,
        renewalStatus: ChannelMembershipRenewalStatus.DISABLED,
        nextRenewalAttemptAt: null,
      }),
    );
    expect(outboxSave).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'channel.status.changed',
        messageKey: 'channel-1',
        payload: buildEvent(),
        status: OutboxMessageStatus.PENDING,
        attemptCount: 0,
        lockedAt: null,
        publishedAt: null,
        lastError: null,
      }),
    );
  });

  it('uses configured channel status topic when writing outbox', async () => {
    configService.get.mockReturnValueOnce('custom.channel.status.changed');

    await service.persistStatusChange({
      channel: buildChannel(ChannelStatus.SUSPENDED),
      disableAutoRenewByChannelId: true,
      statusChangedOutboxMessage: {
        messageKey: 'channel-1',
        payload: buildEvent(),
      },
    });

    expect(outboxSave).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'custom.channel.status.changed',
      }),
    );
  });

  it('does not disable memberships or write outbox when not requested', async () => {
    await service.persistStatusChange({
      channel: buildChannel(ChannelStatus.ACTIVE),
      disableAutoRenewByChannelId: false,
    });

    expect(channelSave).toHaveBeenCalled();
    expect(membershipUpdate).not.toHaveBeenCalled();
    expect(outboxSave).not.toHaveBeenCalled();
  });

  it('rejects the transaction when outbox persistence fails', async () => {
    outboxSave.mockRejectedValueOnce(new Error('outbox insert failed'));

    await expect(
      service.persistStatusChange({
        channel: buildChannel(ChannelStatus.SUSPENDED),
        disableAutoRenewByChannelId: true,
        statusChangedOutboxMessage: {
          messageKey: 'channel-1',
          payload: buildEvent(),
        },
      }),
    ).rejects.toThrow('outbox insert failed');
  });
});

function buildChannel(status: ChannelStatus): ChannelEntity {
  return new ChannelEntity({
    id: 'channel-1',
    userId: 'owner-1',
    name: 'Creator Channel',
    bio: 'Channel bio',
    avatarUrl: '',
    bannerUrl: '',
    status,
    isEligibleForMembership: true,
    isMembershipClosedByAdmin: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  });
}

function buildEvent(): object {
  return {
    eventId: 'event-1',
    eventType: 'channel.status.changed',
    aggregateId: 'channel-1',
    timestamp: '2026-01-02T00:00:00.000Z',
    version: 1,
    traceId: 'trace-1',
    sourceService: 'media-service',
    data: {
      channelId: 'channel-1',
      channelOwnerId: 'owner-1',
      previousStatus: ChannelStatus.ACTIVE,
      currentStatus: ChannelStatus.SUSPENDED,
      changedByAdminId: 'admin-1',
      reason: null,
      changedAt: '2026-01-02T00:00:00.000Z',
    },
  };
}
