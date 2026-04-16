import { ApiProperty } from '@nestjs/swagger';

export class InitVideoUploadResponseDto {
  @ApiProperty()
  videoId!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  rawFileKey!: string;

  @ApiProperty()
  bucket!: string;

  @ApiProperty()
  uploadUrl!: string;
}
