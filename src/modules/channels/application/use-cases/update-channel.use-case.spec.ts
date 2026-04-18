import { ForbiddenException } from '@shared/domain/exceptions/domain.exception';
import {
  ChannelEntity,
  ChannelStatus,
} from '../../domain/entities/channel.entity';
import { UpdateChannelUseCase } from './update-channel.use-case';

describe('UpdateChannelUseCase', () => {
  const channelRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  let useCase: UpdateChannelUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new UpdateChannelUseCase(channelRepository as never);
  });

  it('fails when channel is not active', async () => {
    const channel = ChannelEntity.create({
      userId: 'user-1',
      name: 'Channel',
      bio: 'Bio',
    });
    channel.update({ status: ChannelStatus.INACTIVE });
    channelRepository.findById.mockResolvedValue(channel);

    await expect(
      useCase.execute({
        channelId: channel.id,
        userId: 'user-1',
        name: 'Updated',
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
