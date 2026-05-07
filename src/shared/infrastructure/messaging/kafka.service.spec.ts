import { KafkaService } from './kafka.service';
import type { IKafkaModuleOptions } from '../../application/interfaces/kafka-config.interface';

const mockProducerConnect = jest.fn();
const mockProducerDisconnect = jest.fn();
const mockProducerSend = jest.fn();
const mockConsumerConnect = jest.fn();
const mockConsumerDisconnect = jest.fn();
const mockConsumerSubscribe = jest.fn();
const mockConsumerRun = jest.fn();
const mockConsumerOn = jest.fn();
const mockAdminConnect = jest.fn();
const mockAdminDisconnect = jest.fn();
const mockAdminListTopics = jest.fn();
const mockAdminCreateTopics = jest.fn();
const mockProducerFactory = jest.fn();
const mockConsumerFactory = jest.fn();
const mockAdminFactory = jest.fn();

jest.mock('kafkajs', () => ({
  Kafka: jest.fn().mockImplementation(() => ({
    producer: mockProducerFactory,
    consumer: mockConsumerFactory,
    admin: mockAdminFactory,
  })),
}));

describe('KafkaService', () => {
  const logger = {
    setContext: jest.fn(),
    logInfo: jest.fn(),
    logWarn: jest.fn(),
  };

  const baseConfig: IKafkaModuleOptions = {
    enable: true,
    client: {
      clientId: 'media-service',
      brokers: ['localhost:9092'],
    },
    consumer: {
      groupId: 'media-service-group',
    },
  };

  const previousAutoCreateTopics = process.env.KAFKA_AUTO_CREATE_TOPICS;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.KAFKA_AUTO_CREATE_TOPICS = 'false';
    mockProducerConnect.mockResolvedValue(undefined);
    mockProducerDisconnect.mockResolvedValue(undefined);
    mockProducerSend.mockResolvedValue(undefined);
    mockConsumerConnect.mockResolvedValue(undefined);
    mockConsumerDisconnect.mockResolvedValue(undefined);
    mockConsumerSubscribe.mockResolvedValue(undefined);
    mockConsumerRun.mockResolvedValue(undefined);
    mockAdminConnect.mockResolvedValue(undefined);
    mockAdminDisconnect.mockResolvedValue(undefined);
    mockAdminListTopics.mockResolvedValue([]);
    mockAdminCreateTopics.mockResolvedValue(undefined);
    mockProducerFactory.mockReturnValue({
      connect: mockProducerConnect,
      disconnect: mockProducerDisconnect,
      send: mockProducerSend,
    });
    mockConsumerFactory.mockReturnValue({
      connect: mockConsumerConnect,
      disconnect: mockConsumerDisconnect,
      subscribe: mockConsumerSubscribe,
      run: mockConsumerRun,
      on: mockConsumerOn,
      events: {
        GROUP_JOIN: 'GROUP_JOIN',
      },
    });
    mockAdminFactory.mockReturnValue({
      connect: mockAdminConnect,
      disconnect: mockAdminDisconnect,
      listTopics: mockAdminListTopics,
      createTopics: mockAdminCreateTopics,
    });
  });

  afterAll(() => {
    process.env.KAFKA_AUTO_CREATE_TOPICS = previousAutoCreateTopics;
  });

  it('skips all Kafka connections when disabled', async () => {
    const service = createService({ enable: false });

    await service.onModuleInit();

    expect(mockProducerFactory).not.toHaveBeenCalled();
    expect(mockConsumerFactory).not.toHaveBeenCalled();
    expect(mockAdminFactory).not.toHaveBeenCalled();
    expect(logger.logInfo).toHaveBeenCalledWith(
      'Kafka disabled, skipping connection',
    );
  });

  it('skips consumer run when disabled', async () => {
    const service = createService({ enable: false });

    await service.onApplicationBootstrap();

    expect(mockConsumerRun).not.toHaveBeenCalled();
  });

  it('no-ops emit with a warning when disabled', async () => {
    const service = createService({ enable: false });

    await service.emit('video.viewed', [{ key: 'video-1', value: { id: 1 } }]);

    expect(mockProducerSend).not.toHaveBeenCalled();
    expect(logger.logWarn).toHaveBeenCalledWith(
      'Kafka disabled, skipping emit',
      {
        topic: 'video.viewed',
        messageCount: 1,
      },
    );
  });

  it('no-ops subscription with a warning when disabled', async () => {
    const service = createService({ enable: false });
    const handler = jest.fn().mockResolvedValue(undefined);

    await service.on('video.viewed', handler);

    expect(mockConsumerSubscribe).not.toHaveBeenCalled();
    expect(logger.logWarn).toHaveBeenCalledWith(
      'Kafka disabled, skipping subscription',
      { topic: 'video.viewed' },
    );
  });

  it('emits messages through the producer when enabled', async () => {
    const service = createService();

    await service.onModuleInit();
    await service.emit('video.viewed', [
      { key: 'video-1', value: { videoId: 'video-1' } },
    ]);

    expect(mockProducerSend).toHaveBeenCalledWith({
      topic: 'video.viewed',
      messages: [
        {
          key: 'video-1',
          value: JSON.stringify({ videoId: 'video-1' }),
        },
      ],
    });
  });

  it('registers handlers and subscribes when enabled', async () => {
    const service = createService();
    const handler = jest.fn().mockResolvedValue(undefined);

    await service.onModuleInit();
    await service.on('video.viewed', handler);

    expect(mockConsumerSubscribe).toHaveBeenCalledWith({
      topic: 'video.viewed',
      fromBeginning: false,
    });
  });

  function createService(
    overrides: Partial<IKafkaModuleOptions> = {},
  ): KafkaService {
    return new KafkaService(
      {
        ...baseConfig,
        ...overrides,
      },
      logger as never,
    );
  }
});
