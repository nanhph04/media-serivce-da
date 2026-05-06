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
}
