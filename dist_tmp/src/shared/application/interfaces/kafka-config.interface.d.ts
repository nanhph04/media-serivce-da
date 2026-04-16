import type { ConsumerConfig, ProducerConfig } from 'kafkajs';
export interface IKafkaConfig {
    client: {
        clientId: string;
        brokers: string[];
    };
    consumer?: ConsumerConfig;
    producer?: ProducerConfig;
}
export interface IKafkaModuleOptions extends IKafkaConfig {
    enable: boolean;
}
