import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { LoggerService } from '../../infrastructure/logger/logger.service';
export declare class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger;
    constructor(logger: LoggerService);
    catch(exception: unknown, host: ArgumentsHost): void;
}
