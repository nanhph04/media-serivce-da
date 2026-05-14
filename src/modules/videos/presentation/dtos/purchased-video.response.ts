import { ApiProperty } from '@nestjs/swagger';

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
}
