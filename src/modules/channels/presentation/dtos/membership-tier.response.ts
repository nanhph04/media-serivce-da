import { ApiProperty } from '@nestjs/swagger';

export class MembershipTierResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  channelId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  level!: number;

  @ApiProperty()
  priceCoin!: number;

  @ApiProperty()
  isAcceptingNew!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
