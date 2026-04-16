"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaService = void 0;
const common_1 = require("@nestjs/common");
const kafkajs_1 = require("kafkajs");
const logger_service_1 = require("../logger/logger.service");
let KafkaService = class KafkaService {
    config;
    logger;
    kafka;
    producer = null;
    consumer = null;
    isProducerConnected = false;
    isConsumerConnected = false;
    isConsumerRunning = false;
    handlers = new Map();
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.kafka = new kafkajs_1.Kafka({
            clientId: config.client.clientId,
            brokers: config.client.brokers,
        });
    }
    async onModuleInit() {
        await this.connectProducer();
        await this.connectConsumer();
    }
    async onModuleDestroy() {
        await this.disconnectProducer();
        await this.disconnectConsumer();
    }
    async connectProducer() {
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
    async disconnectProducer() {
        if (this.producer && this.isProducerConnected) {
            await this.producer.disconnect();
            this.isProducerConnected = false;
            this.logger.setContext('KafkaService');
            this.logger.logInfo('Kafka producer disconnected');
        }
    }
    async connectConsumer() {
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
    async disconnectConsumer() {
        if (this.consumer && this.isConsumerConnected) {
            await this.consumer.disconnect();
            this.isConsumerConnected = false;
            this.logger.setContext('KafkaService');
            this.logger.logInfo('Kafka consumer disconnected');
        }
    }
    async emit(topic, messages) {
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
        this.logger.logInfo(`Emitted ${messages.length} message(s) to topic: ${topic}`);
    }
    async on(topic, callback) {
        if (!this.consumer || !this.config.consumer) {
            throw new Error('Kafka consumer not configured');
        }
        const existingHandlers = this.handlers.get(topic) ?? [];
        existingHandlers.push(callback);
        this.handlers.set(topic, existingHandlers);
        await this.consumer.subscribe({ topic, fromBeginning: false });
        if (!this.isConsumerRunning) {
            await this.consumer.run({
                eachMessage: async ({ topic, partition, message, }) => {
                    const key = message.key?.toString() || '';
                    const value = message.value
                        ? JSON.parse(message.value.toString())
                        : {};
                    const headers = {};
                    if (message.headers) {
                        for (const [headerKey, headerValue] of Object.entries(message.headers)) {
                            headers[headerKey] = headerValue?.toString() || '';
                        }
                    }
                    const topicHandlers = this.handlers.get(topic) ?? [];
                    for (const handler of topicHandlers) {
                        await handler({ key, value, headers });
                    }
                    this.logger.setContext('KafkaService');
                    this.logger.logInfo(`Processed message from topic: ${topic}, partition: ${partition}`);
                },
            });
            this.isConsumerRunning = true;
        }
        this.logger.setContext('KafkaService');
        this.logger.logInfo(`Subscribed to topic: ${topic}`);
    }
};
exports.KafkaService = KafkaService;
exports.KafkaService = KafkaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object, logger_service_1.LoggerService])
], KafkaService);
//# sourceMappingURL=kafka.service.js.map