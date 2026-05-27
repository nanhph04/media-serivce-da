import { ApiProperty } from '@nestjs/swagger';
import type { PurchasedVideoItemResponse } from '../../application/dtos/purchased-video-item.response';

export class PurchasedVideoResponseDto {
  @ApiProperty()
  videoId!: string;

  @ApiProperty()
  channelId!: string;

  @ApiProperty({ nullable: true })
  channelName!: string | null;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ nullable: true })
  thumbnailUrl!: string | null;

  @ApiProperty({ nullable: true })
  durationSeconds!: number | null;

  @ApiProperty({ type: [String] })
  categories!: string[];

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty()
  priceCoin!: number;

  @ApiProperty()
  purchasedAt!: string;

  @ApiProperty({ nullable: true })
  publishedAt!: string | null;

  @ApiProperty()
  viewCount!: number;

  @ApiProperty()
  accessStatus!: 'ACTIVE';

  static fromApplicationDto(
    item: PurchasedVideoItemResponse,
  ): PurchasedVideoResponseDto {
    return {
      videoId: item.videoId,
      channelId: item.channelId,
      channelName: item.channelName,
      title: item.title,
      description: item.description,
      thumbnailUrl: item.thumbnailUrl,
      durationSeconds: item.durationSeconds,
      categories: item.categories,
      tags: item.tags,
      priceCoin: item.priceCoin,
      purchasedAt: item.purchasedAt.toISOString(),
      publishedAt: item.publishedAt?.toISOString() ?? null,
      viewCount: item.viewCount,
      accessStatus: item.accessStatus,
    };
  }
}
