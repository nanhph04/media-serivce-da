import { ApiProperty } from '@nestjs/swagger';

export class ConfirmVideoUploadResponseDto {
  @ApiProperty()
  status!: string;

  @ApiProperty()
  message!: string;
}
