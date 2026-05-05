import { Module, Global } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import Redis from 'ioredis';
import { CacheService } from './cache.service';
import { CACHE_CLIENT } from './cache.service';
import {
  IDEMPOTENCY_STORE,
  TEXT_CACHE,
} from '../../application/interfaces/cache-store.interface';

@Global()
@Module({
  providers: [
    {
      provide: CACHE_CLIENT,
      useFactory: (config: ConfigService) => {
        return new Redis({
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD'),
          db: config.get<number>('REDIS_DB', 0),
        });
      },
      inject: [ConfigService],
    },
    CacheService,
    {
      provide: TEXT_CACHE,
      useExisting: CacheService,
    },
    {
      provide: IDEMPOTENCY_STORE,
      useExisting: CacheService,
    },
  ],
  exports: [CacheService, CACHE_CLIENT, TEXT_CACHE, IDEMPOTENCY_STORE],
})
export class CacheModule {}
