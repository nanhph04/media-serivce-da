import { ApiProperty } from '@nestjs/swagger';
import type { UpdateVideoProgressResponse } from '../../application/dtos/update-video-progress.response';

export class UpdateVideoProgressResponseDto {
  @ApiProperty()
  videoId!: string;

  @ApiProperty()
  positionSeconds!: number;

  @ApiProperty()
  completed!: boolean;

  static fromApplicationDto(
    response: UpdateVideoProgressResponse,
  ): UpdateVideoProgressResponseDto {
    return {
      videoId: response.videoId,
      positionSeconds: response.positionSeconds,
      completed: response.completed,
    };
  }
}
