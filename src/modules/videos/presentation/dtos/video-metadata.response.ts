import { ApiProperty } from '@nestjs/swagger';

export class VideoMetadataResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty({ nullable: true })
  thumbnailUrl!: string | null;

  @ApiProperty()
  viewCount!: number;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  visibility!: string;

  @ApiProperty({ nullable: true })
  errorMessage!: string | null;

  @ApiProperty({ nullable: true })
  publishedAt!: string | null;

  @ApiProperty()
  updatedAt!: string;
}
