import { ApiProperty } from '@nestjs/swagger';

import type { PurchaseVideoResponse } from '../../application/dtos/purchase-video.response';

export class PurchaseVideoResponseDto {
  @ApiProperty()
  videoId!: string;

  @ApiProperty()
  channelId!: string;

  @ApiProperty()
  priceCoin!: number;

  @ApiProperty()
  unlocked!: boolean;

  @ApiProperty({ nullable: true })
  paymentTransactionId!: string | null;

  public static fromApplicationDto(
    dto: PurchaseVideoResponse,
  ): PurchaseVideoResponseDto {
    return {
      videoId: dto.videoId,
      channelId: dto.channelId,
      priceCoin: dto.priceCoin,
      unlocked: dto.unlocked,
      paymentTransactionId: dto.paymentTransactionId,
    };
  }
}
