import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  VIDEO_UPLOAD_RESOLUTIONS,
  type VideoUploadResolution,
} from '../../application/dtos/video-upload-resolution';

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

  @ApiProperty({
    required: false,
    description:
      'Optional custom thumbnail object key returned by start upload.',
  })
  @IsString()
  @IsOptional()
  thumbnailObjectKey?: string;
}
