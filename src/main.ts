process.env.TZ = 'UTC';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Server } from 'node:http';
import { AppModule } from './app.module';
import { LoggerService } from './shared/infrastructure/logger/logger.service';
import { HttpExceptionFilter } from './shared/presentation/filters/http-exception.filter';
import { LoggerInterceptor } from './shared/presentation/interceptors/logger.interceptor';
import { SuccessResponseInterceptor } from './shared/presentation/interceptors/success-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = await app.resolve(LoggerService);
  logger.setContext('Bootstrap');
  app.useLogger(logger);

  const loggerInterceptor = await app.resolve(LoggerInterceptor);
  const successResponseInterceptor = await app.resolve(
    SuccessResponseInterceptor,
  );

  app.useGlobalFilters(app.get(HttpExceptionFilter));
  app.useGlobalInterceptors(loggerInterceptor, successResponseInterceptor);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api/media');

  const swaggerOptions = new DocumentBuilder()
    .setTitle('Media Service API')
    .setDescription('API Documentation for Media Service')
    .setVersion('1.0')
    .addTag('media', 'Media management endpoints')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerOptions);
  SwaggerModule.setup('api-docs', app, swaggerDocument);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 4002;

  configureLongLivedHttpConnections(app.getHttpServer() as Server);

  await app.listen(port);
  logger.logInfo('Media Service started', { port });
  logger.logInfo(`Swagger docs available at http://localhost:${port}/api-docs`);
}

function configureLongLivedHttpConnections(server: Server): void {
  server.timeout = 0;
  server.requestTimeout = 0;
  server.keepAliveTimeout = 75_000;
  server.headersTimeout = 80_000;
}

void bootstrap();
