import Redis from 'ioredis';
export declare const CACHE_CLIENT = "CACHE_CLIENT";
export declare class CacheService {
    private readonly redis;
    constructor(redis: Redis);
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: unknown, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    delByPattern(pattern: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    setIfNotExists(key: string, value: unknown, ttlSeconds?: number): Promise<boolean>;
    increment(key: string, ttl?: number): Promise<number>;
    decrement(key: string): Promise<number>;
    getKeys(pattern: string): Promise<string[]>;
}
