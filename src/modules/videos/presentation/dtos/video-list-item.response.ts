import { ApiProperty } from '@nestjs/swagger';
import type { VideoListItemResponse } from '../../application/dtos/video-list-item.response';

export class VideoListItemResponseDto {
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

  @ApiProperty({ nullable: true })
  errorMessage!: string | null;

  @ApiProperty()
  viewCount!: number;

  @ApiProperty({ nullable: true })
  publishedAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  static fromApplicationDto(
    video: VideoListItemResponse,
  ): VideoListItemResponseDto {
    return {
      id: video.id,
      channelId: video.channelId,
      title: video.title,
      description: video.description,
      category: video.category,
      tags: video.tags,
      status: video.status,
      price: video.price,
      requiredTierLevel: video.requiredTierLevel,
      thumbnailUrl: video.thumbnailUrl,
      thumbnailSource: video.thumbnailSource,
      thumbnailStatus: video.thumbnailStatus,
      durationSeconds: video.durationSeconds,
      resolutions: video.resolutions,
      errorMessage: video.errorMessage,
      viewCount: video.viewCount,
      publishedAt: video.publishedAt?.toISOString() ?? null,
      createdAt: video.createdAt.toISOString(),
      updatedAt: video.updatedAt.toISOString(),
    };
  }
}
