import { ConfigService as NestConfigService } from '@nestjs/config';
export declare class ConfigService {
    private readonly configService;
    constructor(configService: NestConfigService);
    get<T = string>(key: string, defaultValue?: T): T;
    getOrThrow<T = string>(key: string): T;
    isProduction(): boolean;
    isDevelopment(): boolean;
    getMinPriceForLevel(level: number): number;
    getNumber(key: string, defaultValue: number): number;
    getBoolean(key: string, defaultValue?: boolean): boolean;
}
