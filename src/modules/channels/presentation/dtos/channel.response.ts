import { ApiProperty } from '@nestjs/swagger';

export class ChannelResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  bio!: string;

  @ApiProperty()
  isEligibleForMembership!: boolean;

  @ApiProperty()
  avatarUrl!: string;

  @ApiProperty()
  bannerUrl!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
