import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt, IsString, Min } from 'class-validator';

export class CreateVideoUploadPartUrlsRequestDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  partNumbers!: number[];
}

export class RecordVideoUploadPartCompletedRequestDto {
  @ApiProperty()
  @IsString()
  etag!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  sizeBytes!: number;
}
