import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';

import {
  FINANCE_PAYMENT_CLIENT,
  type IFinancePaymentClient,
} from '@shared/application/interfaces/finance-payment-client.interface';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';

import {
  VIDEO_PURCHASE_UNLOCK_REPOSITORY,
  type IVideoPurchaseUnlockRepository,
} from '../../domain/repositories/video-purchase-unlock.repository';
import {
  VIDEO_REPOSITORY,
  type IVideoRepository,
} from '../../domain/repositories/video.repository';
import {
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import type { PurchaseVideoCommand } from '../dtos/purchase-video.command';
import type { PurchaseVideoResponse } from '../dtos/purchase-video.response';
import { UnlockVideoUseCase } from './unlock-video.use-case';

@Injectable()
export class PurchaseVideoUseCase extends BaseUseCase<
  PurchaseVideoCommand,
  PurchaseVideoResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(VIDEO_PURCHASE_UNLOCK_REPOSITORY)
    private readonly unlockRepository: IVideoPurchaseUnlockRepository,
    @Inject(FINANCE_PAYMENT_CLIENT)
    private readonly financePaymentClient: IFinancePaymentClient,
    private readonly unlockVideoUseCase: UnlockVideoUseCase,
  ) {
    super();
  }

  public async execute(
    command: PurchaseVideoCommand,
  ): Promise<PurchaseVideoResponse> {
    const video = await this.videoRepository.findById(command.videoId);

    if (!video) {
      throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    }

    if (video.ownerId === command.userId) {
      throw new BadRequestException(ERROR_MESSAGES.CANNOT_PURCHASE_OWN_VIDEO);
    }

    if (
      video.status !== VideoStatus.READY ||
      video.visibility !== VideoVisibility.PUBLIC ||
      !video.isAvailableForPlayback
    ) {
      throw new ConflictException(
        ERROR_MESSAGES.VIDEO_NOT_AVAILABLE_FOR_PURCHASE,
      );
    }

    if (video.price <= 0) {
      throw new BadRequestException(
        ERROR_MESSAGES.VIDEO_DOES_NOT_REQUIRE_PURCHASE,
      );
    }

    if (await this.unlockRepository.exists(video.id, command.userId)) {
      return {
        videoId: video.id,
        channelId: video.channelId,
        priceCoin: video.price,
        unlocked: true,
        paymentTransactionId: null,
      };
    }

    const payment = await this.financePaymentClient.charge({
      payerUserId: command.userId,
      idempotencyKey: `video-purchase:${command.userId}:${video.id}`,
      traceId: command.traceId,
      serviceType: 'video',
      serviceId: video.id,
      channelId: video.channelId,
      channelOwnerId: video.ownerId,
      coinAmount: video.price,
      metadata: {
        videoTitle: video.title,
        thumbnailUrl: video.thumbnailUrl ?? undefined,
      },
    });
    const paymentTransactionId = payment.transactions[0]?.id;

    if (!paymentTransactionId) {
      throw new InternalServerErrorException(
        ERROR_MESSAGES.MEMBERSHIP_PAYMENT_TRANSACTION_MISSING,
      );
    }

    await this.unlockVideoUseCase.execute({
      userId: command.userId,
      videoId: video.id,
    });

    return {
      videoId: video.id,
      channelId: video.channelId,
      priceCoin: video.price,
      unlocked: true,
      paymentTransactionId,
    };
  }
}
