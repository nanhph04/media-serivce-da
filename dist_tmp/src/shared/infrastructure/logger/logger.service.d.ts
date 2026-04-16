import { ConsoleLogger, LogLevel } from '@nestjs/common';
export interface LogMeta {
    [key: string]: unknown;
}
export declare class LoggerService extends ConsoleLogger {
    logInfo(message: string, meta?: LogMeta): void;
    logWarn(message: string, meta?: LogMeta): void;
    logError(message: string, error?: unknown, meta?: LogMeta): void;
    setContext(context: string): void;
    setLogLevels(levels: LogLevel[]): void;
    private formatMeta;
}
