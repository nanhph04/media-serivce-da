import { ApiProperty } from '@nestjs/swagger';

export class MyMembershipItemResponseDto {
  @ApiProperty()
  membershipId!: string;

  @ApiProperty()
  channelId!: string;

  @ApiProperty()
  channelName!: string;

  @ApiProperty({ nullable: true })
  channelAvatarUrl!: string | null;

  @ApiProperty()
  tierId!: string;

  @ApiProperty()
  tierName!: string;

  @ApiProperty()
  tierLevel!: number;

  @ApiProperty()
  priceCoin!: number;

  @ApiProperty()
  startedAt!: string;

  @ApiProperty({ nullable: true })
  expiryDate!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  canRenew!: boolean;

  @ApiProperty()
  canUpgrade!: boolean;

  @ApiProperty()
  isMembershipClosedByAdmin!: boolean;

  @ApiProperty({ nullable: true })
  membershipBlockedReason!: string | null;
}
