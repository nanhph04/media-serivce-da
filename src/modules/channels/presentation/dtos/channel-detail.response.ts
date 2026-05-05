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

export class ChannelMembershipEligibilityDto {
  @ApiProperty()
  isEligible!: boolean;

  @ApiProperty()
  readyVideoCount!: number;

  @ApiProperty()
  minReadyVideoCount!: number;

  @ApiProperty()
  totalVideoViews!: number;

  @ApiProperty()
  minTotalVideoViews!: number;

  @ApiProperty({ type: [String] })
  missingRequirements!: string[];
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
  isEligibleForMembership!: boolean;

  @ApiProperty()
  avatarUrl!: string;

  @ApiProperty()
  bannerUrl!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ type: ChannelMembershipEligibilityDto })
  membershipEligibility!: ChannelMembershipEligibilityDto;

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
