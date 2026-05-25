import { ApiProperty } from '@nestjs/swagger';
import type { AdminVideoPreviewResponse } from '../../application/dtos/admin-video-preview.response';

class AdminVideoPreviewModerationDetailsDto {
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

export class AdminVideoPreviewResponseDto {
  @ApiProperty()
  videoId!: string;

  @ApiProperty()
  previewUrl!: string;

  @ApiProperty()
  expiresAt!: string;

  @ApiProperty({ nullable: true })
  evidenceTimestampSeconds!: number | null;

  @ApiProperty({
    nullable: true,
    type: AdminVideoPreviewModerationDetailsDto,
  })
  moderationDetails!: AdminVideoPreviewModerationDetailsDto | null;

  static fromApplicationDto(
    dto: AdminVideoPreviewResponse,
  ): AdminVideoPreviewResponseDto {
    const response = new AdminVideoPreviewResponseDto();
    response.videoId = dto.videoId;
    response.previewUrl = dto.previewUrl;
    response.expiresAt = dto.expiresAt.toISOString();
    response.evidenceTimestampSeconds = dto.evidenceTimestampSeconds;
    response.moderationDetails = dto.moderationDetails;

    return response;
  }
}
