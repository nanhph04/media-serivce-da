import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class ConfirmVideoUploadRequestDto {
  @ApiProperty({ type: [String], example: ['360p', '720p', '1080p'] })
  @IsArray()
  @IsString({ each: true })
  resolutions!: string[];
}
