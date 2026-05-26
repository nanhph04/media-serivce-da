import { ApiProperty } from '@nestjs/swagger';

class VideoModerationDetailsDto {
  @ApiProperty()
  reason!: string;

  @ApiProperty()
  confidence!: number;

  @ApiProperty({ nullable: true })
  evidenceTimestampSeconds!: number | null;
}

class VideoMetadataMembershipTierDto {
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

export class VideoMetadataResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  channelId!: string;

  @ApiProperty()
  channelName!: string;

  @ApiProperty()
  avatarUrlChannel!: string;

  @ApiProperty({ type: [VideoMetadataMembershipTierDto] })
  membershipTiers!: VideoMetadataMembershipTierDto[];

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  categoryId!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty({ type: [String] })
  tagIds!: string[];

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty({ nullable: true })
  thumbnailUrl!: string | null;

  @ApiProperty()
  thumbnailSource!: string;

  @ApiProperty()
  thumbnailStatus!: string;

  @ApiProperty()
  viewCount!: number;

  @ApiProperty()
  price!: number;

  @ApiProperty({ nullable: true })
  requiredTierLevel!: number | null;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  visibility!: string;

  @ApiProperty({ type: [String] })
  processingWarnings!: string[];

  @ApiProperty({ nullable: true })
  errorMessage!: string | null;

  @ApiProperty()
  jobStatus!: string;

  @ApiProperty()
  jobStatusMessage!: string;

  @ApiProperty({ nullable: true })
  failureReason!: string | null;

  @ApiProperty({ nullable: true, type: VideoModerationDetailsDto })
  moderationDetails!: VideoModerationDetailsDto | null;

  @ApiProperty({ nullable: true })
  publishedAt!: string | null;

  @ApiProperty()
  isDeleted!: boolean;

  @ApiProperty({ nullable: true })
  deletedAt!: string | null;

  @ApiProperty({ nullable: true })
  deletedBy!: string | null;

  @ApiProperty({ nullable: true })
  deleteReason!: string | null;

  @ApiProperty()
  updatedAt!: string;
}
