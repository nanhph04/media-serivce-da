import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  OBJECT_STORAGE_SERVICE,
  type IObjectStorageService,
} from '@shared/application/interfaces/object-storage.service.interface';
import { CacheService } from '@shared/infrastructure/cache/cache.service';
import { Repository } from 'typeorm';
import type {
  IChannelSearchQueryService,
  SearchChannelsQuery,
} from '../../application/interfaces/channel-search-query.service.interface';
import type { ChannelSearchItemResponse } from '../../../search/application/dtos/channel-search-item.response';
import { buildChannelImageUrl } from '../../application/dtos/channel-image-url';
import { ChannelStatus } from '../../domain/entities/channel.entity';
import { ChannelOrmEntity } from '../persistence/channel.orm-entity';

const CHANNEL_SEARCH_CACHE_TTL_SECONDS = 60;

type CachedChannelSearchItem = Omit<
  ChannelSearchItemResponse,
  'createdAt' | 'updatedAt'
> & {
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class ChannelSearchQueryService implements IChannelSearchQueryService {
  constructor(
    @InjectRepository(ChannelOrmEntity)
    private readonly channelOrmRepository: Repository<ChannelOrmEntity>,
    private readonly cacheService: CacheService,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService?: IObjectStorageService,
  ) {}

  async searchChannels(
    query: SearchChannelsQuery,
  ): Promise<ChannelSearchItemResponse[]> {
    const normalizedQuery = query.q.trim().toLowerCase();
    const cacheKey = this.buildCacheKey(normalizedQuery, query.limit);
    const cached =
      await this.getCachedValue<CachedChannelSearchItem[]>(cacheKey);

    if (cached) {
      return cached.map((item) => this.cachedItemToResponse(item));
    }

    const exact = normalizedQuery;
    const prefix = `${escapeLikePattern(normalizedQuery)}%`;
    const partial = `%${escapeLikePattern(normalizedQuery)}%`;

    const rows = await this.channelOrmRepository
      .createQueryBuilder('channel')
      .where('channel.status = :status', { status: ChannelStatus.ACTIVE })
      .andWhere(
        `(
          LOWER(channel.name) LIKE :partial ESCAPE '\\'
          OR LOWER(channel.bio) LIKE :partial ESCAPE '\\'
        )`,
        { partial },
      )
      .addSelect(
        `CASE
          WHEN LOWER(channel.name) = :exact THEN 400
          WHEN LOWER(channel.name) LIKE :prefix ESCAPE '\\' THEN 300
          WHEN LOWER(channel.name) LIKE :partial ESCAPE '\\' THEN 200
          WHEN LOWER(channel.bio) LIKE :partial ESCAPE '\\' THEN 100
          ELSE 0
        END`,
        'search_rank',
      )
      .setParameters({
        exact,
        prefix,
        partial,
      })
      .orderBy('search_rank', 'DESC')
      .addOrderBy('channel.updatedAt', 'DESC')
      .addOrderBy('channel.createdAt', 'DESC')
      .take(query.limit)
      .getMany();

    const response = rows.map((row) => this.toResponse(row));

    await this.setCachedValue(
      cacheKey,
      response.map((item) => this.responseToCached(item)),
    );

    return response;
  }

  private toResponse(row: ChannelOrmEntity): ChannelSearchItemResponse {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      bio: row.bio,
      avatarUrl: buildChannelImageUrl(
        row.avatarObjectKey,
        row.avatarUrl,
        this.objectStorageService,
      ),
      bannerUrl: buildChannelImageUrl(
        row.bannerObjectKey,
        row.bannerUrl,
        this.objectStorageService,
      ),
      status: row.status,
      isEligibleForMembership: row.isEligibleForMembership,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private responseToCached(
    item: ChannelSearchItemResponse,
  ): CachedChannelSearchItem {
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private cachedItemToResponse(
    item: CachedChannelSearchItem,
  ): ChannelSearchItemResponse {
    return {
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    };
  }

  private buildCacheKey(q: string, limit: number): string {
    return `media_service:search:global:q:${q}:limit:${limit}:channels`;
  }

  private async getCachedValue<T>(key: string): Promise<T | null> {
    try {
      return await this.cacheService.get<T>(key);
    } catch {
      return null;
    }
  }

  private async setCachedValue(key: string, value: unknown): Promise<void> {
    try {
      await this.cacheService.set(key, value, CHANNEL_SEARCH_CACHE_TTL_SECONDS);
    } catch {
      // Cache write failure must not fail reads.
    }
  }
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}
