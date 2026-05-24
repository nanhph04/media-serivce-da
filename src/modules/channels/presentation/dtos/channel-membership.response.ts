import { ApiProperty } from '@nestjs/swagger';

import type { ChannelMembershipResponse } from '../../application/dtos/channel-membership.response';

export class ChannelMembershipResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  channelId!: string;

  @ApiProperty()
  membershipId!: string;

  @ApiProperty({ nullable: true })
  expiryDate!: string | null;

  @ApiProperty()
  retryCount!: number;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  autoRenewEnabled!: boolean;

  @ApiProperty()
  renewalStatus!: string;

  @ApiProperty({ nullable: true })
  renewalReminderSentAt!: string | null;

  @ApiProperty({ nullable: true })
  lastRenewalAttemptAt!: string | null;

  @ApiProperty({ nullable: true })
  nextRenewalAttemptAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  static fromApplicationDto(
    dto: ChannelMembershipResponse,
  ): ChannelMembershipResponseDto {
    return {
      id: dto.id,
      userId: dto.userId,
      channelId: dto.channelId,
      membershipId: dto.membershipId,
      expiryDate: dto.expiryDate?.toISOString() ?? null,
      retryCount: dto.retryCount,
      status: dto.status,
      autoRenewEnabled: dto.autoRenewEnabled,
      renewalStatus: dto.renewalStatus,
      renewalReminderSentAt: dto.renewalReminderSentAt?.toISOString() ?? null,
      lastRenewalAttemptAt: dto.lastRenewalAttemptAt?.toISOString() ?? null,
      nextRenewalAttemptAt: dto.nextRenewalAttemptAt?.toISOString() ?? null,
      createdAt: dto.createdAt.toISOString(),
      updatedAt: dto.updatedAt.toISOString(),
    };
  }
}
