import { ApiProperty } from '@nestjs/swagger';

export class RefreshPlaybackTokenResponseDto {
  @ApiProperty()
  videoId!: string;

  @ApiProperty()
  playbackToken!: string;

  @ApiProperty()
  playbackUrl!: string;
}
