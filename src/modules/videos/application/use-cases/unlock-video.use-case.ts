import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { VideoPurchaseUnlockEntity } from '../../domain/entities/video-purchase-unlock.entity';
import {
  type IVideoPurchaseUnlockRepository,
  VIDEO_PURCHASE_UNLOCK_REPOSITORY,
} from '../../domain/repositories/video-purchase-unlock.repository';
import type { UnlockVideoCommand } from '../dtos/unlock-video.command';

@Injectable()
export class UnlockVideoUseCase extends BaseUseCase<UnlockVideoCommand, void> {
  constructor(
    @Inject(VIDEO_PURCHASE_UNLOCK_REPOSITORY)
    private readonly unlockRepository: IVideoPurchaseUnlockRepository,
  ) {
    super();
  }

  async execute(command: UnlockVideoCommand): Promise<void> {
    if (
      !(await this.unlockRepository.exists(command.videoId, command.userId))
    ) {
      await this.unlockRepository.save(
        VideoPurchaseUnlockEntity.create(command),
      );
    }
  }
}
