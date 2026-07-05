import { ApiProperty } from '@nestjs/swagger';

export class VideoUploadPartUrlResponseDto {
  @ApiProperty()
  partNumber!: number;

  @ApiProperty()
  uploadUrl!: string;

  @ApiProperty()
  expiresAt!: string;
}

export class VideoUploadPartUrlsResponseDto {
  @ApiProperty({ type: [VideoUploadPartUrlResponseDto] })
  parts!: VideoUploadPartUrlResponseDto[];
}

export class VideoUploadPartResponseDto {
  @ApiProperty()
  partNumber!: number;

  @ApiProperty()
  etag!: string;

  @ApiProperty()
  sizeBytes!: number;

  @ApiProperty()
  uploadedAt!: string;
}

export class VideoUploadStatusResponseDto {
  @ApiProperty()
  videoId!: string;

  @ApiProperty()
  uploadId!: string;

  @ApiProperty()
  rawFileKey!: string;

  @ApiProperty()
  partSizeBytes!: number;

  @ApiProperty()
  fileName!: string;

  @ApiProperty()
  fileSize!: number;

  @ApiProperty()
  fileLastModified!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  expiresAt!: string;

  @ApiProperty({ type: [VideoUploadPartResponseDto] })
  parts!: VideoUploadPartResponseDto[];
}

export class VideoUploadPartCompletedResponseDto {
  @ApiProperty()
  videoId!: string;

  @ApiProperty()
  uploadId!: string;

  @ApiProperty()
  partNumber!: number;

  @ApiProperty()
  completed!: boolean;
}

export class CompleteVideoUploadResponseDto {
  @ApiProperty()
  videoId!: string;

  @ApiProperty()
  uploadId!: string;

  @ApiProperty()
  rawFileKey!: string;

  @ApiProperty()
  completed!: boolean;
}

export class RenewVideoUploadSessionResponseDto {
  @ApiProperty()
  videoId!: string;

  @ApiProperty()
  uploadId!: string;

  @ApiProperty()
  expiresAt!: string;
}
