import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  IDEMPOTENCY_STORE,
  type IIdempotencyStore,
} from '@shared/application/interfaces/cache-store.interface';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import type { HandleVideoDeleteRefundCompletedCommand } from '../dtos/handle-video-delete-refund-completed.command';

@Injectable()
export class HandleVideoDeleteRefundCompletedUseCase extends BaseUseCase<
  HandleVideoDeleteRefundCompletedCommand,
  void
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(IDEMPOTENCY_STORE)
    private readonly idempotencyStore: IIdempotencyStore,
  ) {
    super();
  }

  async execute(
    command: HandleVideoDeleteRefundCompletedCommand,
  ): Promise<void> {
    if (!(await this.markEventProcessed(command.eventId))) {
      return;
    }

    const video = await this.videoRepository.findById(command.data.videoId);
    if (!video) {
      return;
    }

    video.markRefundCompleted({
      completedAt: new Date(command.data.completedAt),
      summary: {
        requestedEventId: command.data.requestedEventId,
        refundedPurchaseCount: command.data.refundedPurchaseCount,
        skippedPurchaseCount: command.data.skippedPurchaseCount,
      },
    });
    await this.videoRepository.save(video);
  }

  private async markEventProcessed(eventId: string): Promise<boolean> {
    return this.idempotencyStore.setIfNotExists(
      `media:event:${eventId}`,
      '1',
      60 * 60 * 24,
    );
  }
}
