import { ApiProperty } from '@nestjs/swagger';

export class CurrentChannelResponseDto {
  @ApiProperty()
  channelId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  isEligibleForMembership!: boolean;

  @ApiProperty()
  isMembershipClosedByAdmin!: boolean;

  @ApiProperty()
  membershipReviewStatus!: string;

  @ApiProperty({ nullable: true })
  membershipRejectionReason!: string | null;

  @ApiProperty({ nullable: true })
  membershipRequestedAt!: string | null;

  @ApiProperty({ nullable: true })
  membershipReviewedAt!: string | null;
}
