import { ApiProperty } from '@nestjs/swagger';
import type { RankedVideoListItemResponse } from '../../application/dtos/ranked-video-list-item.response';
import { VideoListItemResponseDto } from './video-list-item.response';

export class RankedVideoListItemResponseDto extends VideoListItemResponseDto {
  @ApiProperty()
  metricCount!: number;

  static fromApplicationDto(
    video: RankedVideoListItemResponse,
  ): RankedVideoListItemResponseDto {
    return {
      ...VideoListItemResponseDto.fromApplicationDto(video),
      metricCount: video.metricCount,
    };
  }
}
