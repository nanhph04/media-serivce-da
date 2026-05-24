import { NotFoundException } from '@shared/domain/exceptions/domain.exception';
import {
  ChannelEntity,
  ChannelStatus,
} from '../../domain/entities/channel.entity';
import type { IChannelRepository } from '../../domain/repositories/channel.repository';
import type { IChannelStatusChangeTransaction } from '../interfaces/channel-status-change-transaction.interface';
import { AdminLockChannelUseCase } from './admin-lock-channel.use-case';

describe('AdminLockChannelUseCase', () => {
  it('locks an active channel', async () => {
    const channel = buildChannel(ChannelStatus.ACTIVE);
    const repository = createRepository(channel);
    const transaction = createStatusChangeTransaction();
    const useCase = new AdminLockChannelUseCase(repository, transaction);

    const result = await useCase.execute({
      channelId: 'channel-1',
      adminId: 'admin-1',
      action: 'lock',
    });

    expect(channel.status).toBe(ChannelStatus.SUSPENDED);
    expect(transaction.persistStatusChange).toHaveBeenCalledWith({
      channel,
      disableAutoRenewByChannelId: true,
      statusChangedOutboxMessage: expect.objectContaining({
        messageKey: 'channel-1',
        payload: expect.objectContaining({
          eventType: 'channel.status.changed',
          aggregateId: 'channel-1',
          sourceService: 'media-service',
          data: expect.objectContaining({
            channelId: 'channel-1',
            channelOwnerId: 'owner-1',
            previousStatus: ChannelStatus.ACTIVE,
            currentStatus: ChannelStatus.SUSPENDED,
            changedByAdminId: 'admin-1',
            reason: null,
          }),
        }),
      }),
    });
    expect(result.status).toBe(ChannelStatus.SUSPENDED);
  });

  it('unlocks a suspended channel', async () => {
    const channel = buildChannel(ChannelStatus.SUSPENDED);
    const repository = createRepository(channel);
    const transaction = createStatusChangeTransaction();
    const useCase = new AdminLockChannelUseCase(repository, transaction);

    const result = await useCase.execute({
      channelId: 'channel-1',
      adminId: 'admin-1',
      action: 'unlock',
    });

    expect(channel.status).toBe(ChannelStatus.ACTIVE);
    expect(transaction.persistStatusChange).toHaveBeenCalledWith({
      channel,
      disableAutoRenewByChannelId: false,
      statusChangedOutboxMessage: expect.objectContaining({
        messageKey: 'channel-1',
        payload: expect.objectContaining({
          eventType: 'channel.status.changed',
          aggregateId: 'channel-1',
          data: expect.objectContaining({
            previousStatus: ChannelStatus.SUSPENDED,
            currentStatus: ChannelStatus.ACTIVE,
          }),
        }),
      }),
    });
    expect(result.status).toBe(ChannelStatus.ACTIVE);
  });

  it('persists repeated lock without creating a status event', async () => {
    const channel = buildChannel(ChannelStatus.SUSPENDED);
    const transaction = createStatusChangeTransaction();
    const useCase = new AdminLockChannelUseCase(
      createRepository(channel),
      transaction,
    );

    await useCase.execute({
      channelId: 'channel-1',
      adminId: 'admin-1',
      action: 'lock',
    });

    expect(transaction.persistStatusChange).toHaveBeenCalledWith({
      channel,
      disableAutoRenewByChannelId: true,
      statusChangedOutboxMessage: undefined,
    });
  });

  it('persists repeated unlock without creating a status event', async () => {
    const channel = buildChannel(ChannelStatus.ACTIVE);
    const transaction = createStatusChangeTransaction();
    const useCase = new AdminLockChannelUseCase(
      createRepository(channel),
      transaction,
    );

    await useCase.execute({
      channelId: 'channel-1',
      adminId: 'admin-1',
      action: 'unlock',
    });

    expect(transaction.persistStatusChange).toHaveBeenCalledWith({
      channel,
      disableAutoRenewByChannelId: false,
      statusChangedOutboxMessage: undefined,
    });
  });

  it('rejects when channel does not exist', async () => {
    const useCase = new AdminLockChannelUseCase(
      createRepository(null),
      createStatusChangeTransaction(),
    );

    await expect(
      useCase.execute({
        channelId: 'missing-channel',
        adminId: 'admin-1',
        action: 'lock',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

function createRepository(channel: ChannelEntity | null): IChannelRepository {
  return {
    findById: jest.fn().mockResolvedValue(channel),
  } as unknown as IChannelRepository;
}

function createStatusChangeTransaction(): IChannelStatusChangeTransaction {
  return {
    persistStatusChange: jest.fn().mockResolvedValue(undefined),
  };
}

function buildChannel(status: ChannelStatus): ChannelEntity {
  return new ChannelEntity({
    id: 'channel-1',
    userId: 'owner-1',
    name: 'Channel',
    bio: 'Bio',
    avatarUrl: '',
    bannerUrl: '',
    status,
    isEligibleForMembership: true,
    isMembershipClosedByAdmin: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}
