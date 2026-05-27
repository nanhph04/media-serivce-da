import { ApiProperty } from '@nestjs/swagger';
import type { ContinueWatchingItemResponse } from '../../application/dtos/continue-watching-item.response';

export class ContinueWatchingItemResponseDto {
  @ApiProperty()
  videoId!: string;

  @ApiProperty()
  channelId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ nullable: true })
  thumbnailUrl!: string | null;

  @ApiProperty({ nullable: true })
  durationSeconds!: number | null;

  @ApiProperty()
  resumePositionSeconds!: number;

  @ApiProperty({ nullable: true })
  remainingSeconds!: number | null;

  @ApiProperty()
  lastWatchedAt!: string;

  @ApiProperty()
  viewCount!: number;

  static fromApplicationDto(
    item: ContinueWatchingItemResponse,
  ): ContinueWatchingItemResponseDto {
    return {
      videoId: item.videoId,
      channelId: item.channelId,
      title: item.title,
      thumbnailUrl: item.thumbnailUrl,
      durationSeconds: item.durationSeconds,
      resumePositionSeconds: item.resumePositionSeconds,
      remainingSeconds: item.remainingSeconds,
      lastWatchedAt: item.lastWatchedAt.toISOString(),
      viewCount: item.viewCount,
    };
  }
}
