import { Inject, Injectable } from '@nestjs/common';
import { CacheService } from '@shared/infrastructure/cache/cache.service';
import { KAFKA_SERVICE } from '@shared/infrastructure/messaging/kafka.constants';
import { KafkaService } from '@shared/infrastructure/messaging/kafka.service';
import { ConfigService } from '@shared/infrastructure/config/config.service';

@Injectable()
export class RecordVideoViewUseCase {
  constructor(
    private readonly cacheService: CacheService,
    @Inject(KAFKA_SERVICE) private readonly kafkaService: KafkaService,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: { userId: string; videoId: string }): Promise<void> {
    const dedupeKey = `media:view:${input.userId}:${input.videoId}`;
    const wasCreated = await this.cacheService.setIfNotExists(
      dedupeKey,
      '1',
      this.configService.getNumber('VIDEO_VIEW_DEDUPE_TTL_SECONDS', 60),
    );

    if (!wasCreated) {
      return;
    }

    await this.kafkaService.emit(
      this.configService.get<string>('KAFKA_VIDEO_VIEW_TOPIC', 'video.viewed'),
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
  }
}
