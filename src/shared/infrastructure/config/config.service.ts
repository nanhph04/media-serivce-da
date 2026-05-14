import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import type { IStreamConfig } from '../../application/interfaces/stream-config.interface';
import type { IVideoUploadConfig } from '../../application/interfaces/video-upload-config.interface';
import type { IVideoViewConfig } from '../../application/interfaces/video-view-config.interface';

@Injectable()
export class ConfigService
  implements IStreamConfig, IVideoUploadConfig, IVideoViewConfig
{
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

  getNumberOrThrow(key: string): number {
    const value = this.getOrThrow<string | number>(key);
    if (typeof value === 'number') {
      return value;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      throw new Error(`Config key "${key}" must be a valid number`);
    }

    return parsed;
  }

  getBooleanOrThrow(key: string): boolean {
    const value = this.getOrThrow<string | boolean>(key);
    if (typeof value === 'boolean') {
      return value;
    }

    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    throw new Error(`Config key "${key}" must be "true" or "false"`);
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

  getMinReadyVideosForMembership(): number {
    return this.getNumber('CHANNEL_MEMBERSHIP_MIN_READY_VIDEOS', 5);
  }

  getMinTotalViewsForMembership(): number {
    return this.getNumber('CHANNEL_MEMBERSHIP_MIN_TOTAL_VIEWS', 1000);
  }

  getVideoViewDedupeTtlSeconds(): number {
    return this.getNumber('VIDEO_VIEW_DEDUPE_TTL_SECONDS', 1800);
  }

  getMaxVideoUploadSizeBytes(): number {
    return this.getNumber(
      'VIDEO_MAX_UPLOAD_SIZE_BYTES',
      2 * 1024 * 1024 * 1024,
    );
  }

  getVideoViewTopic(): string {
    return this.get<string>('KAFKA_VIDEO_VIEW_TOPIC', 'video.viewed');
  }

  getVideoViewMinSeconds(): number {
    return this.getNumber('VIDEO_VIEW_MIN_SECONDS', 10);
  }

  getVideoViewMinPercent(): number {
    return this.getNumber('VIDEO_VIEW_MIN_PERCENT', 20);
  }

  getVideoViewFlushIntervalSeconds(): number {
    return this.getNumber('VIDEO_VIEW_FLUSH_INTERVAL_SECONDS', 5);
  }

  getVideoDraftUploadTtlHours(): number {
    return this.getNumber('VIDEO_DRAFT_UPLOAD_TTL_HOURS', 24);
  }

  getVideoDraftCleanupIntervalSeconds(): number {
    return this.getNumber('VIDEO_DRAFT_CLEANUP_INTERVAL_SECONDS', 3600);
  }

  getVideoDraftCleanupBatchSize(): number {
    return this.getNumber('VIDEO_DRAFT_CLEANUP_BATCH_SIZE', 100);
  }

  getVideoModerationTimeoutSeconds(): number {
    return this.getNumber('VIDEO_MODERATION_TIMEOUT_SECONDS', 900);
  }

  getVideoProcessingTimeoutSeconds(): number {
    return this.getNumber('VIDEO_PROCESSING_TIMEOUT_SECONDS', 3600);
  }

  getVideoWatchdogIntervalSeconds(): number {
    return this.getNumber('VIDEO_WATCHDOG_INTERVAL_SECONDS', 60);
  }

  getVideoWatchdogBatchSize(): number {
    return this.getNumber('VIDEO_WATCHDOG_BATCH_SIZE', 100);
  }

  getVideoWatchdogHealthFailureThreshold(): number {
    return this.getNumber('VIDEO_WATCHDOG_HEALTH_FAILURE_THRESHOLD', 3);
  }

  getVideoWatchdogHealthFailureTtlSeconds(): number {
    return this.getNumber('VIDEO_WATCHDOG_HEALTH_FAILURE_TTL_SECONDS', 300);
  }

  getVideoWatchdogStaleProgressIntervalSeconds(): number {
    return this.getNumber(
      'VIDEO_WATCHDOG_STALE_PROGRESS_INTERVAL_SECONDS',
      300,
    );
  }

  getModerationServiceHealthUrl(): string {
    return this.get<string>(
      'MODERATION_SERVICE_HEALTH_URL',
      'http://localhost:8000/health/ready',
    );
  }

  getMediaProcessingServiceHealthUrl(): string {
    return this.get<string>(
      'MEDIA_PROCESSING_SERVICE_HEALTH_URL',
      'http://localhost:4003/health/ready',
    );
  }

  getVideoViewDiscoveryInvalidationIntervalSeconds(): number {
    return this.getNumber(
      'VIDEO_VIEW_DISCOVERY_INVALIDATION_INTERVAL_SECONDS',
      60,
    );
  }

  getMasterPlaylistKeyCacheTtlSeconds(): number {
    return this.getNumber('STREAM_MASTER_PLAYLIST_KEY_CACHE_TTL_SECONDS', 30);
  }

  getRewrittenPlaylistCacheTtlSeconds(): number {
    return this.getNumber('STREAM_REWRITTEN_PLAYLIST_CACHE_TTL_SECONDS', 10);
  }

  getBoolean(key: string, defaultValue = false): boolean {
    const value = this.get<string | boolean>(key, defaultValue);
    if (typeof value === 'boolean') {
      return value;
    }

    return value === 'true';
  }
}
