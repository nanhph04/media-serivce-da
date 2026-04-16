import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { LoggerModule } from '../logger/logger.module';
import { LoggerService } from '../logger/logger.service';
import { KafkaService } from './kafka.service';
import { KAFKA_SERVICE } from './kafka.constants';
import type { IKafkaModuleOptions } from '../../application/interfaces/kafka-config.interface';

@Global()
@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [
    {
      provide: KAFKA_SERVICE,
      inject: [ConfigService, LoggerService],
      useFactory: (
        configService: ConfigService,
        loggerService: LoggerService,
      ): KafkaService => {
        const enableEnv = configService.get<string>('KAFKA_ENABLE');
        const isKafkaEnabled = enableEnv === 'true';

        const brokersEnv = configService.get<string>('KAFKA_BROKERS');
        const brokersArray = brokersEnv
          ? brokersEnv.split(',')
          : ['localhost:9092'];

        const kafkaOptions: IKafkaModuleOptions = {
          enable: isKafkaEnabled,
          client: {
            clientId:
              configService.get<string>('KAFKA_CLIENT_ID') || 'user-service',
            brokers: brokersArray,
          },
          consumer: {
            groupId:
              configService.get<string>('KAFKA_CONSUMER_GROUP_ID') ||
              'user-service-group',
          },
        };

        return new KafkaService(kafkaOptions, loggerService);
      },
    },
  ],
  exports: [KAFKA_SERVICE],
})
export class KafkaModule {}
