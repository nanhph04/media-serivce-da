import { Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { CacheService } from '@shared/infrastructure/cache/cache.service';
import { UnlockVideoUseCase } from './unlock-video.use-case';
import type { HandleVideoPaymentSuccessCommand } from '../dtos/handle-video-payment-success.command';

@Injectable()
export class HandleVideoPaymentSuccessUseCase extends BaseUseCase<
  HandleVideoPaymentSuccessCommand,
  void
> {
  constructor(
    private readonly unlockVideoUseCase: UnlockVideoUseCase,
    private readonly cacheService: CacheService,
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
    return this.cacheService.setIfNotExists(
      `media:event:${eventId}`,
      '1',
      60 * 60 * 24,
    );
  }
}
