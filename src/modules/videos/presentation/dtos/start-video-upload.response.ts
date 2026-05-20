import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartVideoUploadResponseDto {
  @ApiProperty()
  videoId!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  rawFileKey!: string;

  @ApiProperty()
  bucket!: string;

  @ApiProperty()
  uploadId!: string;

  @ApiProperty()
  partSizeBytes!: number;

  @ApiProperty()
  expiresAt!: string;

  @ApiPropertyOptional({ nullable: true })
  thumbnailObjectKey!: string | null;

  @ApiPropertyOptional({ nullable: true })
  thumbnailBucket!: string | null;

  @ApiPropertyOptional({ nullable: true })
  thumbnailUploadUrl!: string | null;
}
