import { ChannelStatus } from '../../../channels/domain/entities/channel.entity';
import { ChannelStatusChangedConsumer } from './channel-status-changed.consumer';

describe('ChannelStatusChangedConsumer', () => {
  const configService = {
    get: jest.fn(),
  };
  const kafkaService = {
    on: jest.fn(),
  };
  const handleChannelStatusChangedUseCase = {
    execute: jest.fn(),
  };

  let consumer: ChannelStatusChangedConsumer;

  beforeEach(() => {
    jest.clearAllMocks();
    consumer = new ChannelStatusChangedConsumer(
      configService as never,
      kafkaService as never,
      handleChannelStatusChangedUseCase as never,
    );
  });

  it('registers topic handler and invalidates discovery caches on status events', async () => {
    let handler:
      | ((payload: {
          value: {
            data: {
              channelId: string;
              channelOwnerId: string;
              previousStatus: ChannelStatus;
              currentStatus: ChannelStatus;
              changedByAdminId: string;
              reason: string | null;
              changedAt: string;
            };
          };
        }) => Promise<void>)
      | undefined;

    configService.get.mockReturnValue('channel.status.changed');
    kafkaService.on.mockImplementation(
      async (_topic: string, callback: typeof handler): Promise<void> => {
        handler = callback;
      },
    );

    await consumer.onModuleInit();

    expect(kafkaService.on).toHaveBeenCalledWith(
      'channel.status.changed',
      expect.any(Function),
    );

    await handler?.({
      value: {
        data: {
          channelId: 'channel-1',
          channelOwnerId: 'owner-1',
          previousStatus: ChannelStatus.ACTIVE,
          currentStatus: ChannelStatus.SUSPENDED,
          changedByAdminId: 'admin-1',
          reason: 'policy violation',
          changedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    });

    expect(handleChannelStatusChangedUseCase.execute).toHaveBeenCalledWith({
      channelId: 'channel-1',
      channelOwnerId: 'owner-1',
      previousStatus: ChannelStatus.ACTIVE,
      currentStatus: ChannelStatus.SUSPENDED,
      changedByAdminId: 'admin-1',
      reason: 'policy violation',
      changedAt: '2026-01-01T00:00:00.000Z',
    });
  });
});
