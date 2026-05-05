import type { EachMessagePayload } from 'kafkajs';
import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Kafka, Producer, Consumer, Admin } from 'kafkajs';
import type { IKafkaConfig } from '../../application/interfaces/kafka-config.interface';
import { LoggerService } from '../logger/logger.service';
import type { IEventPublisher } from '../../application/interfaces/event-publisher.interface';

@Injectable()
export class KafkaService
  implements OnModuleInit, OnApplicationBootstrap, OnModuleDestroy, IEventPublisher
{
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumer: Consumer | null = null;
  private admin: Admin | null = null;
  private isProducerConnected = false;
  private isConsumerConnected = false;
  private isAdminConnected = false;
  private isConsumerRunning = false;
  private readonly handlers = new Map<
    string,
    Array<
      (message: {
        key: string;
        value: unknown;
        headers: Record<string, string>;
      }) => Promise<void>
    >
  >();

  constructor(
    private readonly config: IKafkaConfig,
    private readonly logger: LoggerService,
  ) {
    this.kafka = new Kafka({
      clientId: config.client.clientId,
      brokers: config.client.brokers,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.connectProducer();
    await this.connectConsumer();
    await this.connectAdmin();
    await this.initializeTopics();
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.startConsumerRun();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnectProducer();
    await this.disconnectConsumer();
    await this.disconnectAdmin();
  }

  async connectProducer(): Promise<void> {
    if (!this.producer) {
      this.producer = this.kafka.producer();
    }
    if (!this.isProducerConnected) {
      await this.producer.connect();
      this.isProducerConnected = true;
      this.logger.setContext('KafkaService');
      this.logger.logInfo('Kafka producer connected');
    }
  }

  async disconnectProducer(): Promise<void> {
    if (this.producer && this.isProducerConnected) {
      await this.producer.disconnect();
      this.isProducerConnected = false;
      this.logger.setContext('KafkaService');
      this.logger.logInfo('Kafka producer disconnected');
    }
  }

  async connectConsumer(): Promise<void> {
    if (!this.consumer && this.config.consumer) {
      this.consumer = this.kafka.consumer({
        groupId: this.config.consumer.groupId || 'default-group',
      });
    }

    if (!this.consumer || !this.config.consumer) {
      this.logger.setContext('KafkaService');
      this.logger.logInfo('Kafka consumer not configured, skipping connection');
      return;
    }

    if (!this.isConsumerConnected) {
      await this.consumer.connect();
      this.isConsumerConnected = true;
      this.logger.setContext('KafkaService');
      this.logger.logInfo('Kafka consumer connected');
    }
  }

  async disconnectConsumer(): Promise<void> {
    if (this.consumer && this.isConsumerConnected) {
      await this.consumer.disconnect();
      this.isConsumerConnected = false;
      this.logger.setContext('KafkaService');
      this.logger.logInfo('Kafka consumer disconnected');
    }
  }

  async connectAdmin(): Promise<void> {
    if (!this.admin) {
      this.admin = this.kafka.admin();
    }

    if (!this.isAdminConnected) {
      await this.admin.connect();
      this.isAdminConnected = true;
      this.logger.setContext('KafkaService');
      this.logger.logInfo('Kafka admin connected');
    }
  }

  async disconnectAdmin(): Promise<void> {
    if (this.admin && this.isAdminConnected) {
      await this.admin.disconnect();
      this.isAdminConnected = false;
      this.logger.setContext('KafkaService');
      this.logger.logInfo('Kafka admin disconnected');
    }
  }

  async emit<T = unknown>(
    topic: string,
    messages: Array<{ key?: string; value: T }>,
  ): Promise<void> {
    if (!this.producer) {
      throw new Error('Kafka producer not initialized');
    }
    await this.producer.send({
      topic,
      messages: messages.map((msg) => ({
        key: msg.key,
        value: JSON.stringify(msg.value),
      })),
    });
    this.logger.setContext('KafkaService');
    this.logger.logInfo(
      `Emitted ${messages.length} message(s) to topic: ${topic}`,
    );
  }

  async on<T = unknown>(
    topic: string,
    callback: (message: {
      key: string;
      value: T;
      headers: Record<string, string>;
    }) => Promise<void>,
  ): Promise<void> {
    if (!this.consumer || !this.config.consumer) {
      throw new Error('Kafka consumer not configured');
    }

    const existingHandlers = this.handlers.get(topic) ?? [];
    existingHandlers.push(
      callback as (message: {
        key: string;
        value: unknown;
        headers: Record<string, string>;
      }) => Promise<void>,
    );
    this.handlers.set(topic, existingHandlers);

    try {
      await this.consumer.subscribe({ topic, fromBeginning: false });
    } catch (error: unknown) {
      this.logger.setContext('KafkaService');
      this.logger.logWarn(`Skipping Kafka topic subscription`, {
        topic,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown Kafka subscribe error',
      });
      return;
    }

    this.logger.setContext('KafkaService');
    this.logger.logInfo(`Subscribed to topic: ${topic}`);
  }

  async startConsumerRun(): Promise<void> {
    if (!this.consumer || this.isConsumerRunning) {
      return;
    }

    if (this.handlers.size === 0) {
      this.logger.setContext('KafkaService');
      this.logger.logInfo('Kafka consumer has no topic handlers, skipping run');
      return;
    }

    try {
      const waitForGroupJoin = new Promise<void>((resolve) => {
        this.consumer!.on(this.consumer!.events.GROUP_JOIN, () => {
          resolve();
        });
      });

      await this.consumer.run({
        eachMessage: async ({
          topic,
          partition,
          message,
        }: EachMessagePayload) => {
          const key = message.key?.toString() || '';
          const value: unknown = message.value
            ? (JSON.parse(message.value.toString()) as unknown)
            : {};
          const headers: Record<string, string> = {};
          if (message.headers) {
            for (const [headerKey, headerValue] of Object.entries(
              message.headers,
            )) {
              headers[headerKey] = headerValue?.toString() || '';
            }
          }

          const topicHandlers = this.handlers.get(topic) ?? [];
          for (const handler of topicHandlers) {
            await handler({ key, value, headers });
          }

          this.logger.setContext('KafkaService');
          this.logger.logInfo(
            `Processed message from topic: ${topic}, partition: ${partition}`,
          );
        },
      });

      await waitForGroupJoin;
      this.isConsumerRunning = true;
      this.logger.setContext('KafkaService');
      this.logger.logInfo('Kafka consumer run started');
    } catch (error: unknown) {
      this.logger.setContext('KafkaService');
      this.logger.logWarn(`Kafka consumer run skipped`, {
        error:
          error instanceof Error ? error.message : 'Unknown Kafka run error',
      });
    }
  }

  private async initializeTopics(): Promise<void> {
    if (!this.admin || !this.isAdminConnected) {
      return;
    }

    if (process.env.KAFKA_AUTO_CREATE_TOPICS !== 'true') {
      return;
    }

    const topicsEnv = process.env.KAFKA_TOPICS_TO_CREATE ?? '';
    const topics = topicsEnv
      .split(',')
      .map((topic) => topic.trim())
      .filter((topic) => topic.length > 0);

    if (topics.length === 0) {
      return;
    }

    try {
      const existingTopics = new Set(await this.admin.listTopics());
      const missingTopics = topics.filter(
        (topic) => !existingTopics.has(topic),
      );

      if (missingTopics.length === 0) {
        this.logger.setContext('KafkaService');
        this.logger.logInfo('Kafka topics already initialized');
        return;
      }

      await this.admin.createTopics({
        waitForLeaders: true,
        topics: missingTopics.map((topic) => ({
          topic,
          numPartitions: 1,
          replicationFactor: 1,
        })),
      });

      this.logger.setContext('KafkaService');
      this.logger.logInfo(
        `Kafka topics initialized: ${missingTopics.join(', ')}`,
      );
    } catch (error: unknown) {
      this.logger.setContext('KafkaService');
      this.logger.logWarn(`Kafka topic initialization failed`, {
        topics,
        error:
          error instanceof Error ? error.message : 'Unknown Kafka admin error',
      });
    }
  }
}
