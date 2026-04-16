"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const logger_service_1 = require("./shared/infrastructure/logger/logger.service");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const shared_1 = require("./shared");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
    });
    const logger = await app.resolve(logger_service_1.LoggerService);
    logger.setContext('Bootstrap');
    app.useLogger(logger);
    const loggerInterceptor = await app.resolve(shared_1.LoggerInterceptor);
    app.useGlobalFilters(app.get(shared_1.HttpExceptionFilter));
    app.useGlobalInterceptors(loggerInterceptor);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.setGlobalPrefix('api/media');
    const swaggerOptions = new swagger_1.DocumentBuilder()
        .setTitle('Media Service API')
        .setDescription('API Documentation for Media Service')
        .setVersion('1.0')
        .addTag('media', 'Media management endpoints')
        .build();
    const swaggerDocument = swagger_1.SwaggerModule.createDocument(app, swaggerOptions);
    swagger_1.SwaggerModule.setup('api-docs', app, swaggerDocument);
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT') ?? 4002;
    await app.listen(port);
    console.log(`Application running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map