import { Inject, Injectable } from '@nestjs/common';
import {
  IDEMPOTENCY_STORE,
  type IIdempotencyStore,
} from '@shared/application/interfaces/cache-store.interface';
import {
  EVENT_PUBLISHER,
  type IEventPublisher,
} from '@shared/application/interfaces/event-publisher.interface';
import {
  VIDEO_VIEW_CONFIG,
  type IVideoViewConfig,
} from '@shared/application/interfaces/video-view-config.interface';

@Injectable()
export class RecordVideoViewUseCase {
  constructor(
    @Inject(IDEMPOTENCY_STORE)
    private readonly idempotencyStore: IIdempotencyStore,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: IEventPublisher,
    @Inject(VIDEO_VIEW_CONFIG)
    private readonly videoViewConfig: IVideoViewConfig,
  ) {}

  async execute(input: { userId: string; videoId: string }): Promise<void> {
    const dedupeKey = `media:view:${input.userId}:${input.videoId}`;
    const wasCreated = await this.idempotencyStore.setIfNotExists(
      dedupeKey,
      '1',
      this.videoViewConfig.getVideoViewDedupeTtlSeconds(),
    );

    if (!wasCreated) {
      return;
    }

    try {
      await this.eventPublisher.emit(
        this.videoViewConfig.getVideoViewTopic(),
        [
          {
            key: input.videoId,
            value: {
              eventId: crypto.randomUUID(),
              eventType: 'video.viewed',
              aggregateId: input.videoId,
              timestamp: new Date().toISOString(),
              version: 1,
              traceId: crypto.randomUUID(),
              sourceService: 'media-service',
              data: {
                videoId: input.videoId,
                userId: input.userId,
              },
            },
          },
        ],
      );
    } catch (error: unknown) {
      try {
        await this.idempotencyStore.delete(dedupeKey);
      } catch {
        // Preserve the original publish failure for retry decisions upstream.
      }
      throw error;
    }
  }
}
