import { ApiProperty } from '@nestjs/swagger';
import { MembershipTierResponseDto } from './membership-tier.response';

export class PublicVideoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty({ type: [String] })
  tags!: string[];

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
  isMembershipClosedByAdmin!: boolean;

  @ApiProperty()
  membershipReviewStatus!: string;

  @ApiProperty({ nullable: true })
  membershipRejectionReason!: string | null;

  @ApiProperty({ nullable: true })
  membershipRequestedAt!: string | null;

  @ApiProperty({ nullable: true })
  membershipReviewedAt!: string | null;

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

  @ApiProperty()
  canRenew!: boolean;

  @ApiProperty()
  canUpgrade!: boolean;

  @ApiProperty({ nullable: true })
  membershipBlockedReason!: string | null;

  @ApiProperty()
  isMembershipClosedByAdmin!: boolean;
}
