import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private readonly configService: NestConfigService) {}

  get<T = string>(key: string, defaultValue?: T): T {
    const value = this.configService.get<T>(key);
    return value ?? defaultValue ?? (null as T);
  }

  getOrThrow<T = string>(key: string): T {
    const value = this.configService.get<T>(key);
    if (value === undefined || value === null) {
      throw new Error(`Config key "${key}" is not defined`);
    }
    return value;
  }

  isProduction(): boolean {
    return this.get<string>('NODE_ENV') === 'production';
  }

  isDevelopment(): boolean {
    return this.get<string>('NODE_ENV') === 'development';
  }

  getMinPriceForLevel(level: number): number {
    const key = `MEMBERSHIP_MIN_PRICE_LV${level}`;
    const value = this.get<number>(key);
    if (value === null) {
      return 0;
    }
    return value;
  }

  getNumber(key: string, defaultValue: number): number {
    const value = this.get<string | number>(key, defaultValue);
    if (typeof value === 'number') {
      return value;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }

  getBoolean(key: string, defaultValue = false): boolean {
    const value = this.get<string | boolean>(key, defaultValue);
    if (typeof value === 'boolean') {
      return value;
    }

    return value === 'true';
  }
}
