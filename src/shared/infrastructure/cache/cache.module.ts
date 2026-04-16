import { Module, Global } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import Redis from 'ioredis';
import { CacheService } from './cache.service';
import { CACHE_CLIENT } from './cache.service';

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
  ],
  exports: [CacheService, CACHE_CLIENT],
})
export class CacheModule {}
