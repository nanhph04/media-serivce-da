import { ApiProperty } from '@nestjs/swagger';

export class CancelVideoUploadResponseDto {
  @ApiProperty()
  videoId!: string;

  @ApiProperty()
  cancelled!: boolean;
}
