import { Module, Global } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { LoggerInterceptor } from '../../presentation/interceptors/logger.interceptor';

@Global()
@Module({
  providers: [LoggerService, LoggerInterceptor],
  exports: [LoggerService, LoggerInterceptor],
})
export class LoggerModule {}
