import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  IDEMPOTENCY_STORE,
  type IIdempotencyStore,
} from '@shared/application/interfaces/cache-store.interface';
import { UnlockVideoUseCase } from './unlock-video.use-case';
import type { HandleVideoPaymentSuccessCommand } from '../dtos/handle-video-payment-success.command';

@Injectable()
export class HandleVideoPaymentSuccessUseCase extends BaseUseCase<
  HandleVideoPaymentSuccessCommand,
  void
> {
  constructor(
    private readonly unlockVideoUseCase: UnlockVideoUseCase,
    @Inject(IDEMPOTENCY_STORE)
    private readonly idempotencyStore: IIdempotencyStore,
  ) {
    super();
  }

  async execute(command: HandleVideoPaymentSuccessCommand): Promise<void> {
    if (!(await this.markEventProcessed(command.eventId))) {
      return;
    }

    await this.unlockVideoUseCase.execute({
      userId: command.data.userId,
      videoId: command.data.videoId,
    });
  }

  private async markEventProcessed(eventId: string): Promise<boolean> {
    return this.idempotencyStore.setIfNotExists(
      `media:event:${eventId}`,
      '1',
      60 * 60 * 24,
    );
  }
}
