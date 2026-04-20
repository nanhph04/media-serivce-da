import { ApiProperty } from '@nestjs/swagger';
import { MembershipTierResponseDto } from './membership-tier.response';

export class PublicVideoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ type: [String] })
  categories!: string[];

  @ApiProperty()
  status!: string;

  @ApiProperty({ nullable: true })
  thumbnailUrl!: string | null;

  @ApiProperty({ nullable: true })
  publishedAt!: string | null;
}

export class ChannelDetailResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  bio!: string;

  @ApiProperty()
  avatarUrl!: string;

  @ApiProperty()
  bannerUrl!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ type: [MembershipTierResponseDto] })
  membershipTiers!: MembershipTierResponseDto[];

  @ApiProperty({ type: [PublicVideoDto] })
  publicVideos!: PublicVideoDto[];
}

export class ChannelMembershipStatusResponseDto {
  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ nullable: true })
  membershipId!: string | null;

  @ApiProperty({ nullable: true })
  expiryDate!: string | null;
}
