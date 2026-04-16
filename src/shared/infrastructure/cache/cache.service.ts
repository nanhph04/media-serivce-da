import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

export const CACHE_CLIENT = 'CACHE_CLIENT';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_CLIENT) private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const serialized =
      typeof value === 'string' ? value : JSON.stringify(value);
    if (ttl) {
      await this.redis.setex(key, ttl, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async exists(key: string): Promise<boolean> {
    return (await this.redis.exists(key)) === 1;
  }

  async setIfNotExists(
    key: string,
    value: unknown,
    ttlSeconds?: number,
  ): Promise<boolean> {
    const serialized =
      typeof value === 'string' ? value : JSON.stringify(value);
    const result = ttlSeconds
      ? await this.redis.set(key, serialized, 'EX', ttlSeconds, 'NX')
      : await this.redis.set(key, serialized, 'NX');

    return result === 'OK';
  }

  async increment(key: string, ttl?: number): Promise<number> {
    const count = await this.redis.incr(key);
    if (ttl && count === 1) {
      await this.redis.expire(key, ttl);
    }
    return count;
  }

  async decrement(key: string): Promise<number> {
    return this.redis.decr(key);
  }

  async getKeys(pattern: string): Promise<string[]> {
    return this.redis.keys(pattern);
  }
}
