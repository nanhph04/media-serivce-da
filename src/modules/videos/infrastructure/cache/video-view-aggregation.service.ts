import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import {
  VIDEO_VIEW_CONFIG,
  type IVideoViewConfig,
} from '@shared/application/interfaces/video-view-config.interface';
import { CACHE_CLIENT } from '@shared/infrastructure/cache/cache.service';
import type { IVideoViewAggregation } from '../../application/interfaces/video-view-aggregation.interface';

const DIRTY_VIDEOS_KEY = 'media:views:dirty';

const RECORD_VIEWED_EVENT_SCRIPT = `
if redis.call('SET', KEYS[1], '1', 'EX', ARGV[1], 'NX') then
  redis.call('INCRBY', KEYS[2], 1)
  redis.call('SADD', KEYS[3], ARGV[2])
  return 1
end
return 0
`;

const CLAIM_PENDING_VIEW_DELTA_SCRIPT = `
if redis.call('EXISTS', KEYS[2]) == 1 then
  return 0
end
if redis.call('EXISTS', KEYS[1]) == 0 then
  return 0
end
redis.call('RENAME', KEYS[1], KEYS[2])
return tonumber(redis.call('GET', KEYS[2]) or '0')
`;

const COMPLETE_FLUSH_SCRIPT = `
redis.call('DEL', KEYS[2])
if redis.call('EXISTS', KEYS[1]) == 0 then
  redis.call('SREM', KEYS[3], ARGV[1])
end
return 1
`;

const RESTORE_INFLIGHT_VIEW_DELTA_SCRIPT = `
local inflight = redis.call('GET', KEYS[2])
if not inflight then
  return 0
end
redis.call('INCRBY', KEYS[1], inflight)
redis.call('DEL', KEYS[2])
redis.call('SADD', KEYS[3], ARGV[1])
return tonumber(inflight)
`;

@Injectable()
export class VideoViewAggregationService implements IVideoViewAggregation {
  constructor(
    @Inject(CACHE_CLIENT) private readonly redis: Redis,
    @Inject(VIDEO_VIEW_CONFIG)
    private readonly videoViewConfig: IVideoViewConfig,
  ) {}

  async recordViewedEvent(
    eventId: string,
    videoId: string,
  ): Promise<boolean> {
    const result = await this.redis.eval(
      RECORD_VIEWED_EVENT_SCRIPT,
      3,
      this.getEventKey(eventId),
      this.getPendingKey(videoId),
      DIRTY_VIDEOS_KEY,
      this.videoViewConfig.getVideoViewDedupeTtlSeconds().toString(),
      videoId,
    );

    return Number(result) === 1;
  }

  async getDirtyVideoIds(): Promise<string[]> {
    return this.redis.smembers(DIRTY_VIDEOS_KEY);
  }

  async claimPendingViewDelta(videoId: string): Promise<number | null> {
    const result = await this.redis.eval(
      CLAIM_PENDING_VIEW_DELTA_SCRIPT,
      2,
      this.getPendingKey(videoId),
      this.getInflightKey(videoId),
    );

    const delta = Number(result);
    return Number.isFinite(delta) && delta > 0 ? delta : null;
  }

  async completeFlush(videoId: string): Promise<void> {
    await this.redis.eval(
      COMPLETE_FLUSH_SCRIPT,
      3,
      this.getPendingKey(videoId),
      this.getInflightKey(videoId),
      DIRTY_VIDEOS_KEY,
      videoId,
    );
  }

  async restoreInflightViewDelta(videoId: string): Promise<void> {
    await this.redis.eval(
      RESTORE_INFLIGHT_VIEW_DELTA_SCRIPT,
      3,
      this.getPendingKey(videoId),
      this.getInflightKey(videoId),
      DIRTY_VIDEOS_KEY,
      videoId,
    );
  }

  private getEventKey(eventId: string): string {
    return `media:event:${eventId}`;
  }

  private getPendingKey(videoId: string): string {
    return `media:views:pending:${videoId}`;
  }

  private getInflightKey(videoId: string): string {
    return `media:views:inflight:${videoId}`;
  }
}
