import { ApiProperty } from '@nestjs/swagger';
import type {
  AdminVideoDetailResponse,
  AdminVideoListItemResponse,
  AdminVideoSummaryResponse,
  AdminVideosPageResponse,
} from '../../application/dtos/admin-video.response';

class VideoModerationDetailsDto {
  @ApiProperty()
  reason!: string;

  @ApiProperty()
  confidence!: number;

  @ApiProperty({ nullable: true })
  evidenceTimestampSeconds!: number | null;

  @ApiProperty({ nullable: true, required: false })
  label?: string | null;

  @ApiProperty({ nullable: true, required: false })
  safeScore?: number | null;

  @ApiProperty({ nullable: true, required: false })
  nsfwScore?: number | null;

  @ApiProperty({ nullable: true, required: false })
  sampledFrameCount?: number | null;

  @ApiProperty({ nullable: true, required: false })
  thresholds?: { manual: number; reject: number } | null;
}

export class AdminVideoListItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  channelId!: string;

  @ApiProperty({ nullable: true })
  channelName!: string | null;

  @ApiProperty()
  ownerId!: string;

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
    dto: AdminVideoListItemResponse,
  ): AdminVideoListItemResponseDto {
    const response = new AdminVideoListItemResponseDto();
    response.id = dto.id;
    response.channelId = dto.channelId;
    response.channelName = dto.channelName ?? null;
    response.ownerId = dto.ownerId;
    response.title = dto.title;
    response.description = dto.description;
    response.category = dto.category;
    response.tags = dto.tags;
    response.status = dto.status;
    response.visibility = dto.visibility;
    response.price = dto.price;
    response.requiredTierLevel = dto.requiredTierLevel;
    response.thumbnailUrl = dto.thumbnailUrl;
    response.durationSeconds = dto.durationSeconds;
    response.resolutions = dto.resolutions;
    response.processingWarnings = dto.processingWarnings;
    response.errorMessage = dto.errorMessage;
    response.jobStatus = dto.jobStatus;
    response.jobStatusMessage = dto.jobStatusMessage;
    response.failureReason = dto.failureReason;
    response.moderationDetails = dto.moderationDetails;
    response.viewCount = dto.viewCount;
    response.publishedAt = dto.publishedAt?.toISOString() ?? null;
    response.isDeleted = dto.isDeleted;
    response.deletedAt = dto.deletedAt?.toISOString() ?? null;
    response.deletedBy = dto.deletedBy;
    response.deleteReason = dto.deleteReason;
    response.createdAt = dto.createdAt.toISOString();
    response.updatedAt = dto.updatedAt.toISOString();

    return response;
  }
}

export class AdminVideoDetailResponseDto extends AdminVideoListItemResponseDto {
  @ApiProperty()
  categoryTitle!: string;

  @ApiProperty()
  purchaseCount!: number;

  static fromDetailApplicationDto(
    dto: AdminVideoDetailResponse,
  ): AdminVideoDetailResponseDto {
    const response = Object.assign(
      new AdminVideoDetailResponseDto(),
      AdminVideoListItemResponseDto.fromApplicationDto(dto),
    );
    response.categoryTitle = dto.categoryTitle;
    response.purchaseCount = dto.purchaseCount;

    return response;
  }
}

export class AdminVideoSummaryResponseDto {
  @ApiProperty({ enum: ['day', 'week', 'month', 'all'] })
  period!: 'day' | 'week' | 'month' | 'all';

  @ApiProperty()
  totalVideos!: number;

  @ApiProperty()
  readyVideos!: number;

  @ApiProperty()
  uploadingVideos!: number;

  @ApiProperty()
  pendingManualReviewVideos!: number;

  @ApiProperty()
  rejectedVideos!: number;

  @ApiProperty()
  failedVideos!: number;

  @ApiProperty()
  bannedVideos!: number;

  @ApiProperty()
  totalViews!: number;

  @ApiProperty()
  newVideos!: number;

  @ApiProperty()
  newViews!: number;

  @ApiProperty()
  newPurchases!: number;

  static fromApplicationDto(
    dto: AdminVideoSummaryResponse,
  ): AdminVideoSummaryResponseDto {
    const response = new AdminVideoSummaryResponseDto();
    response.period = dto.period;
    response.totalVideos = dto.totalVideos;
    response.readyVideos = dto.readyVideos;
    response.uploadingVideos = dto.uploadingVideos;
    response.pendingManualReviewVideos = dto.pendingManualReviewVideos;
    response.rejectedVideos = dto.rejectedVideos;
    response.failedVideos = dto.failedVideos;
    response.bannedVideos = dto.bannedVideos;
    response.totalViews = dto.totalViews;
    response.newVideos = dto.newVideos;
    response.newViews = dto.newViews;
    response.newPurchases = dto.newPurchases;

    return response;
  }
}

class AdminVideosPaginationResponseDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}

export class AdminVideosResponseDto {
  @ApiProperty({ type: AdminVideoListItemResponseDto, isArray: true })
  items!: AdminVideoListItemResponseDto[];

  @ApiProperty({ type: AdminVideosPaginationResponseDto })
  pagination!: AdminVideosPaginationResponseDto;

  static fromApplicationDto(
    dto: AdminVideosPageResponse,
  ): AdminVideosResponseDto {
    const response = new AdminVideosResponseDto();
    response.items = dto.items.map((item) =>
      AdminVideoListItemResponseDto.fromApplicationDto(item),
    );
    response.pagination = dto.pagination;

    return response;
  }
}
