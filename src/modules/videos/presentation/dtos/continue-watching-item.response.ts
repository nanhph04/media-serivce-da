import { ApiProperty } from '@nestjs/swagger';

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
}
