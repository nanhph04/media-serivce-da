import { ApiProperty } from '@nestjs/swagger';

import type { PurchaseMembershipResponse } from '../../application/dtos/purchase-membership.response';
import { ChannelMembershipResponseDto } from './channel-membership.response';

export class PurchaseMembershipResponseDto {
  @ApiProperty({ type: ChannelMembershipResponseDto })
  membership!: ChannelMembershipResponseDto;

  @ApiProperty()
  chargedCoinAmount!: number;

  @ApiProperty({ nullable: true })
  paymentTransactionId!: string | null;

  public static fromApplicationDto(
    dto: PurchaseMembershipResponse,
  ): PurchaseMembershipResponseDto {
    return {
      membership: ChannelMembershipResponseDto.fromApplicationDto(
        dto.membership,
      ),
      chargedCoinAmount: dto.chargedCoinAmount,
      paymentTransactionId: dto.paymentTransactionId,
    };
  }
}
