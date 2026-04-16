import { Injectable, Scope, ConsoleLogger, LogLevel } from '@nestjs/common';

export interface LogMeta {
  [key: string]: unknown;
}

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
  /**
   * Backwards-compatible alias for `log()`.
   * Prefer using `this.log(message, meta)` in new code.
   */
  logInfo(message: string, meta?: LogMeta): void {
    if (meta && Object.keys(meta).length > 0) {
      super.log(`${message} ${this.formatMeta(meta)}`);
    } else {
      super.log(message);
    }
  }

  logWarn(message: string, meta?: LogMeta): void {
    if (meta && Object.keys(meta).length > 0) {
      super.warn(`${message} ${this.formatMeta(meta)}`);
    } else {
      super.warn(message);
    }
  }

  logError(message: string, error?: unknown, meta?: LogMeta): void {
    const stack = error instanceof Error ? error.stack : undefined;
    const errorInfo =
      error instanceof Error ? { errorMessage: error.message } : {};
    const merged = { ...errorInfo, ...meta };

    if (Object.keys(merged).length > 0) {
      super.error(`${message} ${this.formatMeta(merged)}`, stack);
    } else {
      super.error(message, stack);
    }
  }

  /**
   * Override setContext to use ConsoleLogger's built-in context support.
   */
  override setContext(context: string): void {
    super.setContext(context);
  }

  /**
   * Configure which log levels are active.
   * Call this from main.ts to adjust based on NODE_ENV.
   */
  setLogLevels(levels: LogLevel[]): void {
    super.setLogLevels(levels);
  }

  private formatMeta(meta: LogMeta): string {
    try {
      return JSON.stringify(meta);
    } catch {
      return '[Unserializable meta]';
    }
  }
}
