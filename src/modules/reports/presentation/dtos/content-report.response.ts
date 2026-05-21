import { ApiProperty } from '@nestjs/swagger';
import type { ContentReportResponse } from '../../application/dtos/content-report.response';

export class ContentReportResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['video', 'channel'] })
  targetType!: string;

  @ApiProperty()
  reporterUserId!: string;

  @ApiProperty({ nullable: true })
  targetVideoId!: string | null;

  @ApiProperty()
  targetChannelId!: string;

  @ApiProperty()
  reason!: string;

  @ApiProperty({ nullable: true })
  evidenceTimestampSeconds!: number | null;

  @ApiProperty({ nullable: true })
  contextVideoId!: string | null;

  @ApiProperty({ nullable: true })
  contextVideoTitle!: string | null;

  @ApiProperty({ enum: ['pending', 'resolved', 'dismissed'] })
  status!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  static fromApplicationDto(
    dto: ContentReportResponse,
  ): ContentReportResponseDto {
    const response = new ContentReportResponseDto();
    response.id = dto.id;
    response.targetType = dto.targetType;
    response.reporterUserId = dto.reporterUserId;
    response.targetVideoId = dto.targetVideoId;
    response.targetChannelId = dto.targetChannelId;
    response.reason = dto.reason;
    response.evidenceTimestampSeconds = dto.evidenceTimestampSeconds;
    response.contextVideoId = dto.contextVideoId;
    response.contextVideoTitle = dto.contextVideoTitle;
    response.status = dto.status;
    response.createdAt = dto.createdAt.toISOString();
    response.updatedAt = dto.updatedAt.toISOString();

    return response;
  }
}
