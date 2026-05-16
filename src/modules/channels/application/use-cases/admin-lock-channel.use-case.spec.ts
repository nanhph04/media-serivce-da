import { NotFoundException } from '@shared/domain/exceptions/domain.exception';
import {
  ChannelEntity,
  ChannelStatus,
} from '../../domain/entities/channel.entity';
import type { IChannelRepository } from '../../domain/repositories/channel.repository';
import { AdminLockChannelUseCase } from './admin-lock-channel.use-case';

describe('AdminLockChannelUseCase', () => {
  it('locks an active channel', async () => {
    const channel = buildChannel(ChannelStatus.ACTIVE);
    const update = jest.fn().mockResolvedValue(undefined);
    const repository = createRepository(channel, update);
    const useCase = new AdminLockChannelUseCase(repository);

    const result = await useCase.execute({
      channelId: 'channel-1',
      adminId: 'admin-1',
      action: 'lock',
    });

    expect(channel.status).toBe(ChannelStatus.SUSPENDED);
    expect(update).toHaveBeenCalledWith(channel);
    expect(result.status).toBe(ChannelStatus.SUSPENDED);
  });

  it('unlocks a suspended channel', async () => {
    const channel = buildChannel(ChannelStatus.SUSPENDED);
    const update = jest.fn().mockResolvedValue(undefined);
    const repository = createRepository(channel, update);
    const useCase = new AdminLockChannelUseCase(repository);

    const result = await useCase.execute({
      channelId: 'channel-1',
      adminId: 'admin-1',
      action: 'unlock',
    });

    expect(channel.status).toBe(ChannelStatus.ACTIVE);
    expect(update).toHaveBeenCalledWith(channel);
    expect(result.status).toBe(ChannelStatus.ACTIVE);
  });

  it('rejects when channel does not exist', async () => {
    const useCase = new AdminLockChannelUseCase(createRepository(null));

    await expect(
      useCase.execute({
        channelId: 'missing-channel',
        adminId: 'admin-1',
        action: 'lock',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

function createRepository(
  channel: ChannelEntity | null,
  update = jest.fn().mockResolvedValue(undefined),
): IChannelRepository {
  return {
    findById: jest.fn().mockResolvedValue(channel),
    update,
  } as unknown as IChannelRepository;
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
