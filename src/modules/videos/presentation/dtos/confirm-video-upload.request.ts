import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
} from 'class-validator';

export const VIDEO_UPLOAD_RESOLUTIONS = ['480p', '720p', '1080p'] as const;
export type VideoUploadResolution = (typeof VIDEO_UPLOAD_RESOLUTIONS)[number];

export class ConfirmVideoUploadRequestDto {
  @ApiProperty({
    type: [String],
    example: ['480p', '720p', '1080p'],
    enum: VIDEO_UPLOAD_RESOLUTIONS,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @ArrayUnique()
  @IsIn(VIDEO_UPLOAD_RESOLUTIONS, { each: true })
  resolutions!: VideoUploadResolution[];
}
