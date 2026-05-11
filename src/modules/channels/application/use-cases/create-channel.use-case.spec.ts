import { BadRequestException } from '@shared/domain/exceptions/domain.exception';
import {
  ChannelEntity,
  ChannelStatus,
} from '../../domain/entities/channel.entity';
import { CreateChannelUseCase } from './create-channel.use-case';

describe('CreateChannelUseCase', () => {
  const channelRepository = {
    findByUserId: jest.fn(),
  };
  const channelCreationTransaction = {
    createChannelWithOutbox: jest.fn(),
  };

  const useCase = new CreateChannelUseCase(
    channelRepository as never,
    channelCreationTransaction as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    channelRepository.findByUserId.mockResolvedValue(null);
    channelCreationTransaction.createChannelWithOutbox.mockResolvedValue(
      undefined,
    );
  });

  it('creates a channel and stores a channel.created outbox event', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      traceId: 'trace-1',
      name: 'Creator Channel',
      bio: 'Channel bio',
    });

    expect(result.userId).toBe('user-1');
    expect(result.name).toBe('Creator Channel');
    expect(
      channelCreationTransaction.createChannelWithOutbox,
    ).toHaveBeenCalledWith(
      expect.any(ChannelEntity),
      expect.objectContaining({
        topic: 'channel.created',
        messageKey: 'user-1',
      }),
    );

    const [, outboxMessage] =
      channelCreationTransaction.createChannelWithOutbox.mock.calls[0];

    expect(outboxMessage.payload).toMatchObject({
      eventId: expect.any(String),
      eventType: 'channel.created',
      aggregateId: 'user-1',
      timestamp: expect.any(String),
      version: 1,
      traceId: 'trace-1',
      sourceService: 'media-service',
      data: {
        channelId: result.id,
        userId: 'user-1',
        title: 'Creator Channel',
      },
    });
  });

  it('does not write channel or outbox when channel already exists', async () => {
    channelRepository.findByUserId.mockResolvedValue(buildChannel());

    await expect(
      useCase.execute({
        userId: 'user-1',
        traceId: 'trace-1',
        name: 'Creator Channel',
        bio: 'Channel bio',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(
      channelCreationTransaction.createChannelWithOutbox,
    ).not.toHaveBeenCalled();
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
