import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { LoggerService } from '../../infrastructure/logger/logger.service';
export declare class LoggerInterceptor implements NestInterceptor {
    private readonly logger;
    constructor(logger: LoggerService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
    private generateRequestId;
    private maskSensitiveData;
}
