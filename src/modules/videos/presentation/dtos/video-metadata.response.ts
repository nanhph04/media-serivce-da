import { ApiProperty } from '@nestjs/swagger';
import type { VideoMetadataResponse } from '../../application/dtos/video-metadata.response';

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

  static fromApplicationDto(
    metadata: VideoMetadataResponse,
  ): VideoMetadataResponseDto {
    return {
      id: metadata.id,
      channelId: metadata.channelId,
      channelName: metadata.channelName,
      avatarUrlChannel: metadata.avatarUrlChannel,
      membershipTiers: metadata.membershipTiers.map((tier) => ({
        id: tier.id,
        channelId: tier.channelId,
        name: tier.name,
        level: tier.level,
        priceCoin: tier.priceCoin,
        isAcceptingNew: tier.isAcceptingNew,
        createdAt: tier.createdAt.toISOString(),
        updatedAt: tier.updatedAt.toISOString(),
      })),
      title: metadata.title,
      description: metadata.description,
      categoryId: metadata.categoryId,
      category: metadata.category,
      tagIds: metadata.tagIds,
      tags: metadata.tags,
      thumbnailUrl: metadata.thumbnailUrl,
      thumbnailSource: metadata.thumbnailSource,
      thumbnailStatus: metadata.thumbnailStatus,
      viewCount: metadata.viewCount,
      price: metadata.price,
      requiredTierLevel: metadata.requiredTierLevel,
      status: metadata.status,
      visibility: metadata.visibility,
      processingWarnings: metadata.processingWarnings,
      errorMessage: metadata.errorMessage,
      jobStatus: metadata.jobStatus,
      jobStatusMessage: metadata.jobStatusMessage,
      failureReason: metadata.failureReason,
      moderationDetails: metadata.moderationDetails,
      publishedAt: metadata.publishedAt?.toISOString() ?? null,
      isDeleted: metadata.isDeleted,
      deletedAt: metadata.deletedAt?.toISOString() ?? null,
      deletedBy: metadata.deletedBy,
      deleteReason: metadata.deleteReason,
      updatedAt: metadata.updatedAt.toISOString(),
    };
  }
}
