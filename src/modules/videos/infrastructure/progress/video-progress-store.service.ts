import { Injectable } from '@nestjs/common';
import { CacheService } from '@shared/infrastructure/cache/cache.service';
import type {
  VideoProgressSnapshot,
  VideoProgressStage,
} from '../../application/dtos/video-progress.snapshot';
import type { IVideoProgressStore } from '../../application/interfaces/video-progress-store.interface';

const PROGRESS_TTL_SECONDS = 60 * 60 * 24;

const STAGE_RANK: Record<VideoProgressStage, number> = {
  pending_moderation: 10,
  moderating: 20,
  processing: 30,
  ready: 40,
  pending_manual_review: 40,
  rejected: 40,
  failed: 40,
};

@Injectable()
export class VideoProgressStoreService implements IVideoProgressStore {
  constructor(private readonly cacheService: CacheService) {}

  async get(videoId: string): Promise<VideoProgressSnapshot | null> {
    return this.cacheService.get<VideoProgressSnapshot>(this.getKey(videoId));
  }

  async applyProgressUpdate(
    snapshot: VideoProgressSnapshot,
  ): Promise<VideoProgressSnapshot | null> {
    const normalized = this.normalizeSnapshot(snapshot);
    const current = await this.get(normalized.videoId);

    if (current && !this.shouldAccept(current, normalized)) {
      return null;
    }

    await this.cacheService.set(
      this.getKey(normalized.videoId),
      normalized,
      PROGRESS_TTL_SECONDS,
    );
    return normalized;
  }

  private shouldAccept(
    current: VideoProgressSnapshot,
    next: VideoProgressSnapshot,
  ): boolean {
    const currentRank = STAGE_RANK[current.stage];
    const nextRank = STAGE_RANK[next.stage];

    if (current.terminal && !next.terminal) {
      return false;
    }

    if (nextRank > currentRank) {
      return true;
    }

    if (nextRank < currentRank) {
      return false;
    }

    return next.percent >= current.percent;
  }

  private normalizeSnapshot(
    snapshot: VideoProgressSnapshot,
  ): VideoProgressSnapshot {
    return {
      ...snapshot,
      percent: Math.max(0, Math.min(100, Math.round(snapshot.percent))),
      updatedAt: snapshot.updatedAt || new Date().toISOString(),
      detail: snapshot.detail ?? null,
      errorCode: snapshot.errorCode ?? null,
    };
  }

  private getKey(videoId: string): string {
    return `media:video-progress:${videoId}`;
  }
}
