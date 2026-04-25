import { ApiProperty } from '@nestjs/swagger';

export class PlayVideoResponseDto {
  @ApiProperty()
  videoId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  playbackToken!: string;

  @ApiProperty()
  playbackUrl!: string;

  @ApiProperty()
  resumePositionSeconds!: number;

  @ApiProperty()
  isResumeAvailable!: boolean;
}
