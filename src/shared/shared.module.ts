import { Global, Module } from '@nestjs/common';
import { CacheModule } from './infrastructure/cache/cache.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { ConfigModule } from './infrastructure/config/config.module';
import { KafkaModule } from './infrastructure/messaging/kafka.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { SecurityModule } from './infrastructure/security/security.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { HttpExceptionFilter } from './presentation/filters/http-exception.filter';
import { LoggerService } from './infrastructure/logger/logger.service';
import { LoggerInterceptor } from './presentation/interceptors/logger.interceptor';
import { SuccessResponseInterceptor } from './presentation/interceptors/success-response.interceptor';
import { InternalGatewayGuard } from './presentation/guards/internal-gateway.guard';
import { AdminRoleGuard } from './presentation/guards/admin-role.guard';

@Global()
@Module({
  imports: [
    CacheModule,
    DatabaseModule,
    LoggerModule,
    ConfigModule,
    KafkaModule,
    QueueModule,
    SecurityModule,
    StorageModule,
  ],
  providers: [
    LoggerInterceptor,
    SuccessResponseInterceptor,
    InternalGatewayGuard,
    AdminRoleGuard,
    {
      provide: HttpExceptionFilter,
      useFactory: (logger: LoggerService) => new HttpExceptionFilter(logger),
      inject: [LoggerService],
    },
  ],
  exports: [
    CacheModule,
    DatabaseModule,
    LoggerModule,
    ConfigModule,
    HttpExceptionFilter,
    InternalGatewayGuard,
    AdminRoleGuard,
    LoggerInterceptor,
    SuccessResponseInterceptor,
    QueueModule,
    SecurityModule,
    StorageModule,
  ],
})
export class SharedModule {}
