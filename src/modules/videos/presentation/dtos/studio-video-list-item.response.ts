import { ApiProperty } from '@nestjs/swagger';
import type { StudioVideoListItemResponse } from '../../application/dtos/studio-video-list-item.response';

class VideoModerationDetailsDto {
  @ApiProperty()
  reason!: string;

  @ApiProperty()
  confidence!: number;

  @ApiProperty({ nullable: true })
  evidenceTimestampSeconds!: number | null;
}

export class StudioVideoListItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  channelId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty()
  status!: string;

  @ApiProperty()
  visibility!: string;

  @ApiProperty()
  price!: number;

  @ApiProperty({ nullable: true })
  requiredTierLevel!: number | null;

  @ApiProperty({ nullable: true })
  thumbnailUrl!: string | null;

  @ApiProperty()
  thumbnailSource!: string;

  @ApiProperty()
  thumbnailStatus!: string;

  @ApiProperty({ nullable: true })
  durationSeconds!: number | null;

  @ApiProperty({ type: [String] })
  resolutions!: string[];

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

  @ApiProperty()
  viewCount!: number;

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
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  static fromApplicationDto(
    video: StudioVideoListItemResponse,
  ): StudioVideoListItemResponseDto {
    return {
      id: video.id,
      channelId: video.channelId,
      title: video.title,
      description: video.description,
      category: video.category,
      tags: video.tags,
      status: video.status,
      visibility: video.visibility,
      price: video.price,
      requiredTierLevel: video.requiredTierLevel,
      thumbnailUrl: video.thumbnailUrl,
      thumbnailSource: video.thumbnailSource,
      thumbnailStatus: video.thumbnailStatus,
      durationSeconds: video.durationSeconds,
      resolutions: video.resolutions,
      processingWarnings: video.processingWarnings,
      errorMessage: video.errorMessage,
      jobStatus: video.jobStatus,
      jobStatusMessage: video.jobStatusMessage,
      failureReason: video.failureReason,
      moderationDetails: video.moderationDetails,
      viewCount: video.viewCount,
      publishedAt: video.publishedAt?.toISOString() ?? null,
      isDeleted: video.isDeleted,
      deletedAt: video.deletedAt?.toISOString() ?? null,
      deletedBy: video.deletedBy,
      deleteReason: video.deleteReason,
      createdAt: video.createdAt.toISOString(),
      updatedAt: video.updatedAt.toISOString(),
    };
  }
}
