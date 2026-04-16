import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import type { IKafkaConfig } from '../../application/interfaces/kafka-config.interface';
import { LoggerService } from '../logger/logger.service';
export declare class KafkaService implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly logger;
    private kafka;
    private producer;
    private consumer;
    private isProducerConnected;
    private isConsumerConnected;
    private isConsumerRunning;
    private readonly handlers;
    constructor(config: IKafkaConfig, logger: LoggerService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    connectProducer(): Promise<void>;
    disconnectProducer(): Promise<void>;
    connectConsumer(): Promise<void>;
    disconnectConsumer(): Promise<void>;
    emit<T = unknown>(topic: string, messages: Array<{
        key?: string;
        value: T;
    }>): Promise<void>;
    on<T = unknown>(topic: string, callback: (message: {
        key: string;
        value: T;
        headers: Record<string, string>;
    }) => Promise<void>): Promise<void>;
}
