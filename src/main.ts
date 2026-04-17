import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggerService } from './shared/infrastructure/logger/logger.service';
import { HttpExceptionFilter } from './shared/presentation/filters/http-exception.filter';
import { LoggerInterceptor } from './shared/presentation/interceptors/logger.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = await app.resolve(LoggerService);
  logger.setContext('Bootstrap');
  app.useLogger(logger);

  const loggerInterceptor = await app.resolve(LoggerInterceptor);

  app.useGlobalFilters(app.get(HttpExceptionFilter));
  app.useGlobalInterceptors(loggerInterceptor);

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

  await app.listen(port);
    logger.logInfo("Media Service started", { port });
  logger.logInfo(`Swagger docs available at http://localhost:${port}/api-docs`);
}
void bootstrap();
