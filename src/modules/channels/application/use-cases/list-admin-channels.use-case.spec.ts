import {
  BadRequestException,
  ForbiddenException,
} from '@shared/domain/exceptions/domain.exception';
import {
  ChannelEntity,
  ChannelStatus,
} from '../../domain/entities/channel.entity';
import type { IChannelRepository } from '../../domain/repositories/channel.repository';
import { ListAdminChannelsUseCase } from './list-admin-channels.use-case';

describe('ListAdminChannelsUseCase', () => {
  it('rejects non-admin callers', async () => {
    const useCase = new ListAdminChannelsUseCase(createChannelRepository());

    await expect(
      useCase.execute({ adminId: 'user-1', role: 'creator' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects missing admin id', async () => {
    const useCase = new ListAdminChannelsUseCase(createChannelRepository());

    await expect(
      useCase.execute({ adminId: ' ', role: 'admin' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('normalizes filters and returns paginated channels', async () => {
    const findAdminChannels = jest.fn().mockResolvedValue({
      items: [buildChannel()],
      total: 1,
    });
    const useCase = new ListAdminChannelsUseCase(
      createChannelRepository({ findAdminChannels }),
    );

    const result = await useCase.execute({
      adminId: 'admin-1',
      role: 'admin',
      page: 2,
      limit: 1000,
      status: ChannelStatus.ACTIVE,
      ownerId: ' owner-1 ',
      q: ' music ',
    });

    expect(findAdminChannels).toHaveBeenCalledWith({
      page: 2,
      limit: 100,
      status: ChannelStatus.ACTIVE,
      ownerId: 'owner-1',
      q: 'music',
    });
    expect(result.pagination).toEqual({
      page: 2,
      limit: 100,
      total: 1,
      totalPages: 1,
    });
    expect(result.items[0]).toMatchObject({
      id: 'channel-1',
      userId: 'owner-1',
      status: ChannelStatus.ACTIVE,
    });
  });

  it('rejects invalid status filters', async () => {
    const useCase = new ListAdminChannelsUseCase(createChannelRepository());

    await expect(
      useCase.execute({
        adminId: 'admin-1',
        role: 'admin',
        status: 'deleted',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

function createChannelRepository(input?: {
  findAdminChannels?: jest.Mock;
}): IChannelRepository {
  return {
    findAdminChannels:
      input?.findAdminChannels ??
      jest.fn().mockResolvedValue({ items: [], total: 0 }),
  } as unknown as IChannelRepository;
}

function buildChannel(): ChannelEntity {
  return new ChannelEntity({
    id: 'channel-1',
    userId: 'owner-1',
    name: 'Channel',
    bio: 'Bio',
    avatarUrl: '',
    bannerUrl: '',
    status: ChannelStatus.ACTIVE,
    isEligibleForMembership: true,
    isMembershipClosedByAdmin: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  });
}
